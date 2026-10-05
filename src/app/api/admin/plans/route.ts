import { NextRequest, NextResponse } from 'next/server';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import { MOCK_SUBSCRIPTION_PLANS } from '@/lib/constants';

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
      const res = await client.query(`
        SELECT 
          id, name, code, description, price_etb::float AS "priceEtb", duration_days AS "durationDays",
          features, is_active AS "isActive", created_at AS "createdAt"
        FROM subscription_plans
        ORDER BY price_etb ASC;
      `);
      return NextResponse.json({
        success: true,
        plans: res.rows,
      });
    } catch (err: any) {
      console.error('[API Admin Plans GET Error]:', err);
      return NextResponse.json({ error: err.message }, { status: 500 });
    } finally {
      client.release();
    }
  }

  return NextResponse.json({
    success: true,
    plans: MOCK_SUBSCRIPTION_PLANS,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, code, description, priceEtb = 0, durationDays = 30, features = [], isActive = true } = body;

    if (!name) {
      return NextResponse.json({ error: 'Plan name is required.' }, { status: 400 });
    }

    const planCode = code?.trim() || name.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Date.now();
    const price = parseFloat(priceEtb) || 0;
    const duration = parseInt(durationDays, 10) || 30;
    const featureList = Array.isArray(features) ? features : [];

    if (pool) {
      const client = await pool.connect();
      try {
        const res = await client.query(
          `
          INSERT INTO subscription_plans (name, code, description, price_etb, duration_days, features, is_active)
          VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7)
          RETURNING id, name, code, description, price_etb::float AS "priceEtb", duration_days AS "durationDays", features, is_active AS "isActive";
          `,
          [name.trim(), planCode, description || '', price, duration, JSON.stringify(featureList), isActive]
        );

        return NextResponse.json({
          success: true,
          plan: res.rows[0],
          message: 'Subscription plan created successfully!',
        });
      } finally {
        client.release();
      }
    }

    return NextResponse.json({
      success: true,
      plan: {
        id: 'mock-plan-' + Date.now(),
        name,
        code: planCode,
        description,
        priceEtb: price,
        durationDays: duration,
        features: featureList,
        isActive,
      },
      message: 'Plan created (local mode).',
    });
  } catch (err: any) {
    console.error('[API Admin Plans POST Error]:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, description, priceEtb, durationDays, features, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: 'Plan ID is required.' }, { status: 400 });
    }

    if (pool) {
      const client = await pool.connect();
      try {
        const updates: string[] = [];
        const values: any[] = [];
        let index = 1;

        if (name) {
          updates.push(`name = $${index++}`);
          values.push(name.trim());
        }
        if (description !== undefined) {
          updates.push(`description = $${index++}`);
          values.push(description);
        }
        if (typeof priceEtb === 'number') {
          updates.push(`price_etb = $${index++}`);
          values.push(priceEtb);
        }
        if (typeof durationDays === 'number') {
          updates.push(`duration_days = $${index++}`);
          values.push(durationDays);
        }
        if (Array.isArray(features)) {
          updates.push(`features = $${index++}::jsonb`);
          values.push(JSON.stringify(features));
        }
        if (typeof isActive === 'boolean') {
          updates.push(`is_active = $${index++}`);
          values.push(isActive);
        }

        updates.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(id);

        const sql = `UPDATE subscription_plans SET ${updates.join(', ')} WHERE id = $${index} RETURNING id, name, price_etb::float AS "priceEtb", is_active AS "isActive";`;
        const res = await client.query(sql, values);

        return NextResponse.json({
          success: true,
          plan: res.rows[0],
          message: 'Subscription plan updated successfully.',
        });
      } finally {
        client.release();
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Plan updated (local mode).',
    });
  } catch (err: any) {
    console.error('[API Admin Plans PATCH Error]:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Plan ID is required.' }, { status: 400 });
    }

    if (pool) {
      const client = await pool.connect();
      try {
        await client.query(`DELETE FROM subscription_plans WHERE id = $1;`, [id]);
        return NextResponse.json({
          success: true,
          message: 'Subscription plan deleted.',
        });
      } finally {
        client.release();
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Plan deleted (local mode).',
    });
  } catch (err: any) {
    console.error('[API Admin Plans DELETE Error]:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
