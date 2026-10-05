import { NextRequest, NextResponse } from 'next/server';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import { MOCK_SUBSCRIPTION_PLANS, MOCK_PHARMACY_SUBSCRIPTIONS } from '@/lib/constants';

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
      // 1. Fetch all pharmacy subscriptions with pharmacy details
      const subQuery = `
        SELECT 
          ps.id,
          ps.pharmacy_id AS "pharmacyId",
          p.name AS "pharmacyName",
          p.sub_city AS "pharmacySubCity",
          p.phone_number AS "pharmacyPhone",
          ps.plan_id AS "planId",
          ps.plan_name AS "planName",
          ps.price_paid_etb::float AS "pricePaidEtb",
          ps.payment_method AS "paymentMethod",
          ps.payment_reference AS "paymentReference",
          ps.status,
          ps.starts_at AS "startsAt",
          ps.expires_at AS "expiresAt",
          ps.admin_notes AS "adminNotes",
          ps.created_at AS "createdAt",
          ROUND(EXTRACT(EPOCH FROM (ps.expires_at - CURRENT_TIMESTAMP)) / 86400)::int AS "daysRemaining"
        FROM pharmacy_subscriptions ps
        JOIN pharmacies p ON ps.pharmacy_id = p.id
        ORDER BY ps.created_at DESC;
      `;

      // 2. Fetch all subscription plans
      const plansQuery = `
        SELECT 
          id, name, code, description, price_etb::float AS "priceEtb", duration_days AS "durationDays",
          features, is_active AS "isActive", created_at AS "createdAt"
        FROM subscription_plans
        ORDER BY price_etb ASC;
      `;

      // 3. Fetch all pharmacies for the "Add Subscription" dropdown picker
      const pharmaListQuery = `
        SELECT id, name, sub_city AS "subCity", phone_number AS "phoneNumber", license_number AS "licenseNumber"
        FROM pharmacies
        ORDER BY name ASC;
      `;

      const [subRes, plansRes, pharmaRes] = await Promise.all([
        client.query(subQuery),
        client.query(plansQuery),
        client.query(pharmaListQuery),
      ]);

      return NextResponse.json({
        success: true,
        subscriptions: subRes.rows,
        plans: plansRes.rows,
        pharmacies: pharmaRes.rows,
      });
    } catch (err: any) {
      console.error('[API Admin Subscriptions GET Error]:', err);
      return NextResponse.json({ error: err.message }, { status: 500 });
    } finally {
      client.release();
    }
  }

  return NextResponse.json({
    success: true,
    subscriptions: MOCK_PHARMACY_SUBSCRIPTIONS,
    plans: MOCK_SUBSCRIPTION_PLANS,
    pharmacies: [],
  });
}

// POST: Add new subscription manually by admin
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      pharmacyId,
      planId,
      planName,
      pricePaidEtb = 0,
      durationDays = 30,
      paymentMethod = 'manual_admin',
      paymentReference,
      status = 'active',
      adminNotes,
      autoVerifyPharmacy = true,
    } = body;

    if (!pharmacyId || !planName) {
      return NextResponse.json(
        { error: 'Please select a pharmacy and subscription plan name.' },
        { status: 400 }
      );
    }

    const duration = parseInt(durationDays, 10) || 30;
    const price = parseFloat(pricePaidEtb) || 0.0;

    if (pool) {
      const client = await pool.connect();
      try {
        // Calculate expiration date
        const insertQuery = `
          INSERT INTO pharmacy_subscriptions (
            pharmacy_id,
            plan_id,
            plan_name,
            price_paid_etb,
            payment_method,
            payment_reference,
            status,
            starts_at,
            expires_at,
            admin_notes
          ) VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP + ($8 || ' days')::interval,
            $9
          )
          RETURNING 
            id,
            pharmacy_id AS "pharmacyId",
            plan_name AS "planName",
            price_paid_etb::float AS "pricePaidEtb",
            payment_method AS "paymentMethod",
            payment_reference AS "paymentReference",
            status,
            starts_at AS "startsAt",
            expires_at AS "expiresAt",
            admin_notes AS "adminNotes",
            created_at AS "createdAt";
        `;

        const res = await client.query(insertQuery, [
          pharmacyId,
          planId || null,
          planName.trim(),
          price,
          paymentMethod,
          paymentReference ? paymentReference.trim() : null,
          status,
          duration,
          adminNotes ? adminNotes.trim() : null,
        ]);

        // Auto verify pharmacy if requested
        if (autoVerifyPharmacy) {
          await client.query(
            `UPDATE pharmacies SET is_verified = TRUE, verification_status = 'approved', updated_at = CURRENT_TIMESTAMP WHERE id = $1;`,
            [pharmacyId]
          );
        }

        return NextResponse.json({
          success: true,
          subscription: res.rows[0],
          message: `Subscription "${planName}" successfully added for pharmacy!`,
        });
      } finally {
        client.release();
      }
    }

    // Local fallback
    const mockCreated = {
      id: 'sub-custom-' + Date.now(),
      pharmacyId,
      planName,
      pricePaidEtb: price,
      paymentMethod,
      paymentReference,
      status,
      startsAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + duration * 86400000).toISOString(),
      adminNotes,
      daysRemaining: duration,
    };

    return NextResponse.json({
      success: true,
      subscription: mockCreated,
      message: `Subscription "${planName}" added (local mode).`,
    });
  } catch (err: any) {
    console.error('[API Admin Subscriptions POST Error]:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH: Renew, update status, or edit subscription
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, action = 'renew', extensionDays = 30, status, adminNotes, pricePaidEtb, paymentReference } = body;

    if (!id) {
      return NextResponse.json({ error: 'Subscription ID is required.' }, { status: 400 });
    }

    if (pool) {
      const client = await pool.connect();
      try {
        if (action === 'renew') {
          const days = parseInt(extensionDays, 10) || 30;
          // If already expired, start from NOW, otherwise extend current expires_at
          const renewQuery = `
            UPDATE pharmacy_subscriptions
            SET 
              expires_at = CASE 
                WHEN expires_at < CURRENT_TIMESTAMP THEN CURRENT_TIMESTAMP + ($2 || ' days')::interval
                ELSE expires_at + ($2 || ' days')::interval
              END,
              status = 'active',
              updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING id, status, expires_at AS "expiresAt";
          `;

          const res = await client.query(renewQuery, [id, days]);
          return NextResponse.json({
            success: true,
            subscription: res.rows[0],
            message: `Subscription successfully extended by ${days} days!`,
          });
        }

        if (action === 'update_status') {
          const res = await client.query(
            `UPDATE pharmacy_subscriptions SET status = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING id, status;`,
            [id, status]
          );
          return NextResponse.json({
            success: true,
            subscription: res.rows[0],
            message: `Subscription status updated to "${status}".`,
          });
        }

        if (action === 'edit') {
          const updates: string[] = [];
          const values: any[] = [];
          let index = 1;

          if (typeof pricePaidEtb === 'number') {
            updates.push(`price_paid_etb = $${index++}`);
            values.push(pricePaidEtb);
          }
          if (paymentReference !== undefined) {
            updates.push(`payment_reference = $${index++}`);
            values.push(paymentReference);
          }
          if (adminNotes !== undefined) {
            updates.push(`admin_notes = $${index++}`);
            values.push(adminNotes);
          }
          if (status) {
            updates.push(`status = $${index++}`);
            values.push(status);
          }

          updates.push(`updated_at = CURRENT_TIMESTAMP`);
          values.push(id);

          const sql = `UPDATE pharmacy_subscriptions SET ${updates.join(', ')} WHERE id = $${index} RETURNING id, status, admin_notes AS "adminNotes";`;
          const res = await client.query(sql, values);

          return NextResponse.json({
            success: true,
            subscription: res.rows[0],
            message: 'Subscription updated successfully.',
          });
        }

        return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });
      } finally {
        client.release();
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Subscription updated (local mode).',
    });
  } catch (err: any) {
    console.error('[API Admin Subscriptions PATCH Error]:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE: Cancel/delete subscription
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Subscription ID is required.' }, { status: 400 });
    }

    if (pool) {
      const client = await pool.connect();
      try {
        await client.query(`DELETE FROM pharmacy_subscriptions WHERE id = $1;`, [id]);
        return NextResponse.json({
          success: true,
          message: 'Subscription deleted successfully.',
        });
      } finally {
        client.release();
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Subscription deleted (local mode).',
    });
  } catch (err: any) {
    console.error('[API Admin Subscriptions DELETE Error]:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
