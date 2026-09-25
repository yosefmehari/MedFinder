import { NextRequest, NextResponse } from 'next/server';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import { getMockSearchResults } from '@/lib/constants';

if (typeof window === 'undefined') {
  neonConfig.webSocketConstructor = ws;
}

const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : null;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') || '';
  const lat = parseFloat(searchParams.get('lat') || '9.0016'); // Addis Bole center default
  const lng = parseFloat(searchParams.get('lng') || '38.7885');
  const subCity = searchParams.get('subcity') || null;

  if (pool) {
    try {
      const client = await pool.connect();
      try {
        const queryText = `
          SELECT 
            p.id AS pharmacy_id,
            p.name AS pharmacy_name,
            p.license_number,
            p.sub_city,
            p.woreda,
            p.street_address,
            p.landmark,
            p.phone_number,
            p.is_24_hours,
            p.latitude,
            p.longitude,
            p.is_verified,
            p.rating,
            ST_Distance(
              p.location, 
              ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography
            ) / 1000.0 AS distance_km,
            m.id AS medicine_id,
            m.brand_name,
            m.generic_name,
            m.dosage_form,
            m.strength,
            m.therapeutic_category AS category,
            m.is_scarce,
            m.requires_prescription,
            m.standard_retail_price,
            pi.stock_status,
            pi.unit_price,
            TO_CHAR(pi.last_verified_at, 'YYYY-MM-DD HH24:MI') AS last_verified_at
          FROM pharmacies p
          JOIN pharmacy_inventory pi ON p.id = pi.pharmacy_id
          JOIN medicines m ON pi.medicine_id = m.id
          WHERE 
            p.is_verified = TRUE
            AND pi.stock_status IN ('in_stock', 'low_stock')
            AND ($3::text IS NULL OR $3 = 'all' OR p.sub_city ILIKE '%' || $3 || '%')
            AND (
              $4::text = '' 
              OR m.brand_name ILIKE '%' || $4 || '%' 
              OR m.generic_name ILIKE '%' || $4 || '%' 
              OR m.therapeutic_category ILIKE '%' || $4 || '%'
            )
          ORDER BY distance_km ASC;
        `;

        const res = await client.query(queryText, [lat, lng, subCity, q]);

        const formattedResults = res.rows.map((row) => ({
          pharmacy: {
            id: row.pharmacy_id,
            name: row.pharmacy_name,
            licenseNumber: row.license_number,
            subCity: row.sub_city,
            woreda: row.woreda,
            streetAddress: row.street_address,
            landmark: row.landmark,
            phoneNumber: row.phone_number,
            is24Hours: row.is_24_hours,
            latitude: row.latitude,
            longitude: row.longitude,
            isVerified: row.is_verified,
            rating: parseFloat(row.rating),
          },
          medicine: {
            id: row.medicine_id,
            brandName: row.brand_name,
            genericName: row.generic_name,
            dosageForm: row.dosage_form,
            strength: row.strength,
            category: row.category,
            isScarce: row.is_scarce,
            requiresPrescription: row.requires_prescription,
            standardPriceEtb: parseFloat(row.standard_retail_price),
          },
          stockStatus: row.stock_status,
          unitPrice: parseFloat(row.unit_price),
          lastVerifiedAt: row.last_verified_at,
          distanceKm: Math.round(parseFloat(row.distance_km) * 10) / 10,
        }));

        return NextResponse.json({
          source: 'neon_postgis',
          total: formattedResults.length,
          results: formattedResults,
        });
      } finally {
        client.release();
      }
    } catch (err: any) {
      console.error('[API Search] Database query failed, falling back to mock:', err.message);
    }
  }

  // Graceful fallback to mock data
  const fallback = getMockSearchResults(q, lat, lng);
  return NextResponse.json({
    source: 'mock_fallback',
    total: fallback.length,
    results: fallback,
  });
}
