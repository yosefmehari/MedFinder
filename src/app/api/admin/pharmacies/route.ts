import { NextRequest, NextResponse } from 'next/server';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import { ADDIS_SUB_CITIES, MOCK_PHARMACIES } from '@/lib/constants';

if (typeof window === 'undefined') {
  neonConfig.webSocketConstructor = ws;
}

const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : null;

export async function GET(req: NextRequest) {
  if (pool) {
    const client = await pool.connect();
    try {
      const query = `
        SELECT 
          p.id,
          p.name,
          p.license_number AS "licenseNumber",
          p.sub_city AS "subCity",
          p.woreda,
          p.street_address AS "streetAddress",
          p.landmark,
          p.phone_number AS "phoneNumber",
          p.alternate_phone AS "alternatePhone",
          p.is_24_hours AS "is24Hours",
          p.is_verified AS "isVerified",
          p.verification_status AS "verificationStatus",
          p.rating::float,
          p.created_at AS "createdAt",
          u.full_name AS "ownerName",
          u.phone_number AS "ownerPhone",
          COALESCE(inv.inventory_count, 0)::int AS "inventoryCount",
          sub.plan_name AS "activePlanName",
          sub.status AS "subscriptionStatus",
          sub.expires_at AS "subscriptionExpiresAt"
        FROM pharmacies p
        LEFT JOIN users u ON p.owner_id = u.id
        LEFT JOIN (
          SELECT pharmacy_id, COUNT(*) AS inventory_count
          FROM pharmacy_inventory
          GROUP BY pharmacy_id
        ) inv ON inv.pharmacy_id = p.id
        LEFT JOIN LATERAL (
          SELECT plan_name, status, expires_at
          FROM pharmacy_subscriptions
          WHERE pharmacy_id = p.id AND status = 'active' AND expires_at > CURRENT_TIMESTAMP
          ORDER BY expires_at DESC
          LIMIT 1
        ) sub ON TRUE
        ORDER BY p.created_at DESC;
      `;

      const res = await client.query(query);
      return NextResponse.json({
        success: true,
        pharmacies: res.rows,
      });
    } catch (err: any) {
      console.error('[API Admin Pharmacies GET Error]:', err);
      return NextResponse.json({ error: err.message }, { status: 500 });
    } finally {
      client.release();
    }
  }

  return NextResponse.json({
    success: true,
    pharmacies: MOCK_PHARMACIES.map((p) => ({
      ...p,
      inventoryCount: 3,
      verificationStatus: p.isVerified ? 'approved' : 'pending',
      activePlanName: 'Pro Dispensary Radar',
      subscriptionStatus: 'active',
      subscriptionExpiresAt: new Date(Date.now() + 20 * 86400000).toISOString(),
    })),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      licenseNumber,
      subCity = 'Bole',
      woreda = 'Woreda 01',
      streetAddress,
      landmark,
      phoneNumber,
      is24Hours = false,
      isVerified = true,
      ownerName,
    } = body;

    if (!name || !streetAddress || !phoneNumber) {
      return NextResponse.json(
        { error: 'Name, street address, and phone number are required.' },
        { status: 400 }
      );
    }

    const subCityObj = ADDIS_SUB_CITIES.find(
      (s) => s.id.toLowerCase() === subCity.toLowerCase() || s.nameEn.toLowerCase() === subCity.toLowerCase()
    ) || ADDIS_SUB_CITIES[0];

    const lat = subCityObj.lat + (Math.random() - 0.5) * 0.006;
    const lng = subCityObj.lng + (Math.random() - 0.5) * 0.006;
    const license = licenseNumber?.trim() || `EFDA-AA-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    if (pool) {
      const client = await pool.connect();
      try {
        let ownerId: string | null = null;
        if (ownerName) {
          const userRes = await client.query(
            `
            INSERT INTO users (full_name, phone_number, role)
            VALUES ($1, $2, 'pharmacy_admin')
            ON CONFLICT (phone_number) DO UPDATE SET full_name = EXCLUDED.full_name
            RETURNING id;
            `,
            [ownerName, phoneNumber]
          );
          ownerId = userRes.rows[0]?.id || null;
        }

        const pharmaRes = await client.query(
          `
          INSERT INTO pharmacies (
            owner_id, name, license_number, sub_city, woreda, street_address, landmark,
            phone_number, is_24_hours, latitude, longitude, is_verified, verification_status, rating
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 5.0
          )
          RETURNING id, name, license_number AS "licenseNumber", sub_city AS "subCity", street_address AS "streetAddress", phone_number AS "phoneNumber", is_verified AS "isVerified";
          `,
          [
            ownerId,
            name.trim(),
            license,
            subCityObj.nameEn,
            woreda,
            streetAddress.trim(),
            landmark || null,
            phoneNumber.trim(),
            !!is24Hours,
            lat,
            lng,
            !!isVerified,
            isVerified ? 'approved' : 'pending',
          ]
        );

        return NextResponse.json({
          success: true,
          pharmacy: pharmaRes.rows[0],
          message: 'Pharmacy added successfully!',
        });
      } finally {
        client.release();
      }
    }

    return NextResponse.json({
      success: true,
      pharmacy: {
        id: 'mock-p-' + Date.now(),
        name,
        licenseNumber: license,
        subCity: subCityObj.nameEn,
        streetAddress,
        phoneNumber,
        isVerified,
      },
      message: 'Pharmacy created (local mode).',
    });
  } catch (err: any) {
    console.error('[API Admin Pharmacy POST Error]:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, isVerified, verificationStatus, name, phoneNumber, streetAddress, subCity, is24Hours } = body;

    if (!id) {
      return NextResponse.json({ error: 'Pharmacy ID is required.' }, { status: 400 });
    }

    if (pool) {
      const client = await pool.connect();
      try {
        const updates: string[] = [];
        const values: any[] = [];
        let index = 1;

        if (typeof isVerified === 'boolean') {
          updates.push(`is_verified = $${index++}`);
          values.push(isVerified);
          updates.push(`verification_status = $${index++}`);
          values.push(isVerified ? 'approved' : 'pending');
        } else if (verificationStatus) {
          updates.push(`verification_status = $${index++}`);
          values.push(verificationStatus);
          updates.push(`is_verified = $${index++}`);
          values.push(verificationStatus === 'approved');
        }

        if (name) {
          updates.push(`name = $${index++}`);
          values.push(name.trim());
        }
        if (phoneNumber) {
          updates.push(`phone_number = $${index++}`);
          values.push(phoneNumber.trim());
        }
        if (streetAddress) {
          updates.push(`street_address = $${index++}`);
          values.push(streetAddress.trim());
        }
        if (subCity) {
          updates.push(`sub_city = $${index++}`);
          values.push(subCity);
        }
        if (typeof is24Hours === 'boolean') {
          updates.push(`is_24_hours = $${index++}`);
          values.push(is24Hours);
        }

        updates.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(id);

        const sqlText = `UPDATE pharmacies SET ${updates.join(', ')} WHERE id = $${index} RETURNING id, name, is_verified AS "isVerified", verification_status AS "verificationStatus";`;
        const res = await client.query(sqlText, values);

        return NextResponse.json({
          success: true,
          pharmacy: res.rows[0],
          message: 'Pharmacy updated successfully!',
        });
      } finally {
        client.release();
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Pharmacy updated (local mode).',
    });
  } catch (err: any) {
    console.error('[API Admin Pharmacy PATCH Error]:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Pharmacy ID is required.' }, { status: 400 });
    }

    if (pool) {
      const client = await pool.connect();
      try {
        await client.query(`DELETE FROM pharmacies WHERE id = $1;`, [id]);
        return NextResponse.json({
          success: true,
          message: 'Pharmacy deleted successfully.',
        });
      } finally {
        client.release();
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Pharmacy deleted (local mode).',
    });
  } catch (err: any) {
    console.error('[API Admin Pharmacy DELETE Error]:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
