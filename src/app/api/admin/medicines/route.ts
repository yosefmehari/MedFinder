import { NextRequest, NextResponse } from 'next/server';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import { MOCK_MEDICINES } from '@/lib/constants';

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
          m.id,
          m.brand_name AS "brandName",
          m.generic_name AS "genericName",
          m.dosage_form AS "dosageForm",
          m.strength,
          m.manufacturer,
          m.therapeutic_category AS "category",
          m.is_scarce AS "isScarce",
          m.requires_prescription AS "requiresPrescription",
          m.standard_retail_price::float AS "standardPriceEtb",
          m.description,
          m.created_at AS "createdAt",
          COALESCE(stock_info.pharmacy_count, 0)::int AS "stockingPharmaciesCount"
        FROM medicines m
        LEFT JOIN (
          SELECT medicine_id, COUNT(DISTINCT pharmacy_id) AS pharmacy_count
          FROM pharmacy_inventory
          WHERE stock_status IN ('in_stock', 'low_stock')
          GROUP BY medicine_id
        ) stock_info ON stock_info.medicine_id = m.id
        ORDER BY m.is_scarce DESC, m.brand_name ASC;
      `;

      const res = await client.query(query);
      return NextResponse.json({
        success: true,
        medicines: res.rows,
      });
    } catch (err: any) {
      console.error('[API Admin Medicines GET Error]:', err);
      return NextResponse.json({ error: err.message }, { status: 500 });
    } finally {
      client.release();
    }
  }

  return NextResponse.json({
    success: true,
    medicines: MOCK_MEDICINES.map((m) => ({
      ...m,
      stockingPharmaciesCount: 2,
    })),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      brandName,
      genericName,
      dosageForm = 'Tablet',
      strength = '500mg',
      manufacturer,
      category = 'General Medicine',
      isScarce = false,
      requiresPrescription = true,
      standardPriceEtb = 100,
      description,
    } = body;

    if (!brandName || !genericName) {
      return NextResponse.json(
        { error: 'Brand name and generic name are required.' },
        { status: 400 }
      );
    }

    const price = parseFloat(standardPriceEtb) || 0;

    if (pool) {
      const client = await pool.connect();
      try {
        const res = await client.query(
          `
          INSERT INTO medicines (
            brand_name, generic_name, dosage_form, strength, manufacturer,
            therapeutic_category, is_scarce, requires_prescription, standard_retail_price, description
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
          )
          RETURNING 
            id, brand_name AS "brandName", generic_name AS "genericName",
            dosage_form AS "dosageForm", strength, is_scarce AS "isScarce",
            standard_retail_price::float AS "standardPriceEtb";
          `,
          [
            brandName.trim(),
            genericName.trim(),
            dosageForm.trim(),
            strength.trim(),
            manufacturer ? manufacturer.trim() : null,
            category.trim(),
            !!isScarce,
            !!requiresPrescription,
            price,
            description ? description.trim() : null,
          ]
        );

        return NextResponse.json({
          success: true,
          medicine: res.rows[0],
          message: `Medicine "${brandName}" added to the global catalog!`,
        });
      } finally {
        client.release();
      }
    }

    return NextResponse.json({
      success: true,
      medicine: {
        id: 'mock-med-' + Date.now(),
        brandName,
        genericName,
        dosageForm,
        strength,
        category,
        isScarce,
        standardPriceEtb: price,
      },
      message: `Medicine "${brandName}" added (local mode).`,
    });
  } catch (err: any) {
    console.error('[API Admin Medicines POST Error]:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, isScarce, standardPriceEtb, description, category, requiresPrescription } = body;

    if (!id) {
      return NextResponse.json({ error: 'Medicine ID is required.' }, { status: 400 });
    }

    if (pool) {
      const client = await pool.connect();
      try {
        const updates: string[] = [];
        const values: any[] = [];
        let index = 1;

        if (typeof isScarce === 'boolean') {
          updates.push(`is_scarce = $${index++}`);
          values.push(isScarce);
        }
        if (typeof standardPriceEtb === 'number') {
          updates.push(`standard_retail_price = $${index++}`);
          values.push(standardPriceEtb);
        }
        if (description !== undefined) {
          updates.push(`description = $${index++}`);
          values.push(description);
        }
        if (category) {
          updates.push(`therapeutic_category = $${index++}`);
          values.push(category);
        }
        if (typeof requiresPrescription === 'boolean') {
          updates.push(`requires_prescription = $${index++}`);
          values.push(requiresPrescription);
        }

        updates.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(id);

        const sql = `UPDATE medicines SET ${updates.join(', ')} WHERE id = $${index} RETURNING id, brand_name AS "brandName", is_scarce AS "isScarce", standard_retail_price::float AS "standardPriceEtb";`;
        const res = await client.query(sql, values);

        return NextResponse.json({
          success: true,
          medicine: res.rows[0],
          message: 'Medicine updated successfully!',
        });
      } finally {
        client.release();
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Medicine updated (local mode).',
    });
  } catch (err: any) {
    console.error('[API Admin Medicines PATCH Error]:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Medicine ID is required.' }, { status: 400 });
    }

    if (pool) {
      const client = await pool.connect();
      try {
        await client.query(`DELETE FROM medicines WHERE id = $1;`, [id]);
        return NextResponse.json({
          success: true,
          message: 'Medicine deleted from catalog.',
        });
      } finally {
        client.release();
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Medicine deleted (local mode).',
    });
  } catch (err: any) {
    console.error('[API Admin Medicines DELETE Error]:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
