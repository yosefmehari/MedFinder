import { NextRequest, NextResponse } from 'next/server';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import { MOCK_MEDICINES, MOCK_PHARMACIES } from '@/lib/constants';

if (typeof window === 'undefined') {
  neonConfig.webSocketConstructor = ws;
}

const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : null;

// GET: Fetch inventory for a specific pharmacy, along with catalog medicines
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const pharmacyId = searchParams.get('pharmacyId') || 'c0000000-0000-0000-0000-000000000001';

  if (pool) {
    try {
      const client = await pool.connect();
      try {
        // 1. Get pharmacy info
        const pharmacyRes = await client.query(
          `SELECT id, name, license_number, sub_city, woreda, phone_number, is_verified, is_24_hours FROM pharmacies WHERE id = $1;`,
          [pharmacyId]
        );

        // 2. Get all pharmacies for switcher
        const allPharmaciesRes = await client.query(
          `SELECT id, name, sub_city FROM pharmacies ORDER BY name ASC;`
        );

        // 3. Get pharmacy's active inventory
        const inventoryRes = await client.query(
          `
          SELECT 
            pi.id AS inventory_id,
            pi.pharmacy_id,
            pi.medicine_id,
            pi.stock_status,
            pi.quantity,
            pi.unit_price,
            pi.batch_number,
            pi.expiry_date,
            TO_CHAR(pi.last_verified_at, 'YYYY-MM-DD HH24:MI') AS last_verified_at,
            m.brand_name,
            m.generic_name,
            m.dosage_form,
            m.strength,
            m.therapeutic_category AS category,
            m.is_scarce,
            m.requires_prescription,
            m.standard_retail_price
          FROM pharmacy_inventory pi
          JOIN medicines m ON pi.medicine_id = m.id
          WHERE pi.pharmacy_id = $1
          ORDER BY m.brand_name ASC;
        `,
          [pharmacyId]
        );

        // 4. Get all medicines for dropdown
        const allMedicinesRes = await client.query(
          `SELECT id, brand_name, generic_name, strength, standard_retail_price FROM medicines ORDER BY brand_name ASC;`
        );

        return NextResponse.json({
          success: true,
          pharmacy: pharmacyRes.rows[0] || null,
          allPharmacies: allPharmaciesRes.rows,
          inventory: inventoryRes.rows.map((row) => ({
            id: row.inventory_id,
            pharmacyId: row.pharmacy_id,
            medicineId: row.medicine_id,
            stockStatus: row.stock_status,
            quantity: row.quantity,
            unitPrice: parseFloat(row.unit_price),
            batchNumber: row.batch_number,
            expiryDate: row.expiry_date,
            lastVerifiedAt: row.last_verified_at,
            medicine: {
              id: row.medicine_id,
              brandName: row.brand_name,
              genericName: row.generic_name,
              dosageForm: row.dosage_form,
              strength: row.strength,
              category: row.category,
              isScarce: row.is_scarce,
              requiresPrescription: row.requires_prescription,
              standardPriceEtb: parseFloat(row.standard_retail_price || 0),
            },
          })),
          catalogMedicines: allMedicinesRes.rows,
        });
      } finally {
        client.release();
      }
    } catch (err: any) {
      console.error('[API Inventory GET Error]:', err);
    }
  }

  // Graceful fallback for mock mode
  return NextResponse.json({
    success: true,
    pharmacy: MOCK_PHARMACIES[0],
    allPharmacies: MOCK_PHARMACIES.map((p) => ({ id: p.id, name: p.name, subCity: p.subCity })),
    inventory: MOCK_MEDICINES.slice(0, 3).map((m, i) => ({
      id: 'inv-' + i,
      pharmacyId: MOCK_PHARMACIES[0].id,
      medicineId: m.id,
      stockStatus: i === 2 ? 'low_stock' : 'in_stock',
      quantity: 15,
      unitPrice: m.standardPriceEtb,
      lastVerifiedAt: 'Just now',
      medicine: m,
    })),
    catalogMedicines: MOCK_MEDICINES,
  });
}

// PATCH: Update stock status or price of an inventory item
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { pharmacyId, medicineId, stockStatus, unitPrice, quantity } = body;

    if (!pharmacyId || !medicineId) {
      return NextResponse.json(
        { error: 'pharmacyId and medicineId are required' },
        { status: 400 }
      );
    }

    if (pool) {
      const client = await pool.connect();
      try {
        const queryText = `
          UPDATE pharmacy_inventory
          SET 
            stock_status = COALESCE($3, stock_status),
            unit_price = COALESCE($4, unit_price),
            quantity = COALESCE($5, quantity),
            last_verified_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
          WHERE pharmacy_id = $1 AND medicine_id = $2
          RETURNING *;
        `;
        const res = await client.query(queryText, [
          pharmacyId,
          medicineId,
          stockStatus,
          unitPrice,
          quantity,
        ]);

        if (res.rows.length === 0) {
          return NextResponse.json({ error: 'Inventory item not found' }, { status: 404 });
        }

        return NextResponse.json({
          success: true,
          inventory: res.rows[0],
          message: 'Inventory updated successfully.',
        });
      } finally {
        client.release();
      }
    }

    return NextResponse.json({
      success: true,
      inventory: { pharmacyId, medicineId, stockStatus, unitPrice, quantity },
      message: 'Inventory updated (mock mode).',
    });
  } catch (error: any) {
    console.error('[API Inventory PATCH Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Add new medicine to pharmacy inventory
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { pharmacyId, medicineId, stockStatus = 'in_stock', unitPrice, quantity = 10 } = body;

    if (!pharmacyId || !medicineId || !unitPrice) {
      return NextResponse.json(
        { error: 'pharmacyId, medicineId, and unitPrice are required' },
        { status: 400 }
      );
    }

    if (pool) {
      const client = await pool.connect();
      try {
        const queryText = `
          INSERT INTO pharmacy_inventory (
            pharmacy_id,
            medicine_id,
            stock_status,
            quantity,
            unit_price,
            last_verified_at
          ) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
          ON CONFLICT (pharmacy_id, medicine_id) 
          DO UPDATE SET 
            stock_status = EXCLUDED.stock_status,
            unit_price = EXCLUDED.unit_price,
            quantity = EXCLUDED.quantity,
            last_verified_at = CURRENT_TIMESTAMP
          RETURNING *;
        `;
        const res = await client.query(queryText, [
          pharmacyId,
          medicineId,
          stockStatus,
          quantity,
          unitPrice,
        ]);

        return NextResponse.json({
          success: true,
          inventory: res.rows[0],
          message: 'Medicine added to inventory.',
        });
      } finally {
        client.release();
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Medicine added (mock mode).',
    });
  } catch (error: any) {
    console.error('[API Inventory POST Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
