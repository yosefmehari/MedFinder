import { NextRequest, NextResponse } from 'next/server';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import {
  MOCK_PHARMACIES,
  MOCK_MEDICINES,
  MOCK_PHARMACY_SUBSCRIPTIONS,
  DEFAULT_PLATFORM_SETTINGS,
} from '@/lib/constants';

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
      // 1. Pharmacies counts
      const pharmaStats = await client.query(`
        SELECT 
          COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE is_verified = TRUE)::int AS verified,
          COUNT(*) FILTER (WHERE is_verified = FALSE OR verification_status = 'pending')::int AS pending
        FROM pharmacies;
      `);

      // 2. Subscriptions counts & revenue
      const subStats = await client.query(`
        SELECT 
          COUNT(*) FILTER (WHERE status = 'active' AND expires_at > CURRENT_TIMESTAMP)::int AS active_subs,
          COALESCE(SUM(price_paid_etb), 0)::float AS total_revenue
        FROM pharmacy_subscriptions;
      `);

      // 3. Medicines counts
      const medStats = await client.query(`
        SELECT 
          COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE is_scarce = TRUE)::int AS scarce
        FROM medicines;
      `);

      // 4. Reservations counts
      const resStats = await client.query(`
        SELECT 
          COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE reservation_status = 'active' AND expires_at > CURRENT_TIMESTAMP)::int AS active_holds
        FROM reservations;
      `);

      // 5. Prescriptions count
      const rxStats = await client.query(`
        SELECT COUNT(*)::int AS total FROM prescriptions;
      `);

      // 6. Recent Subscriptions
      const recentSubsRes = await client.query(`
        SELECT 
          ps.id,
          ps.pharmacy_id AS "pharmacyId",
          p.name AS "pharmacyName",
          p.sub_city AS "pharmacySubCity",
          ps.plan_name AS "planName",
          ps.price_paid_etb::float AS "pricePaidEtb",
          ps.payment_method AS "paymentMethod",
          ps.payment_reference AS "paymentReference",
          ps.status,
          ps.starts_at AS "startsAt",
          ps.expires_at AS "expiresAt",
          ROUND(EXTRACT(EPOCH FROM (ps.expires_at - CURRENT_TIMESTAMP)) / 86400)::int AS "daysRemaining"
        FROM pharmacy_subscriptions ps
        JOIN pharmacies p ON ps.pharmacy_id = p.id
        ORDER BY ps.created_at DESC
        LIMIT 6;
      `);

      // 7. Recent Reservations
      const recentResRes = await client.query(`
        SELECT 
          r.id,
          r.reservation_code AS "reservationCode",
          r.patient_name AS "patientName",
          r.patient_phone AS "patientPhone",
          r.hold_fee_etb::float AS "holdFeeEtb",
          r.payment_provider AS "paymentProvider",
          r.reservation_status AS "reservationStatus",
          r.expires_at AS "expiresAt",
          r.created_at AS "createdAt",
          p.name AS "pharmacyName",
          m.brand_name AS "medicineName"
        FROM reservations r
        JOIN pharmacies p ON r.pharmacy_id = p.id
        JOIN medicines m ON r.medicine_id = m.id
        ORDER BY r.created_at DESC
        LIMIT 6;
      `);

      // 8. Platform Settings
      const settingsRes = await client.query(`SELECT key, value FROM platform_settings;`);
      const settingsObj: Record<string, any> = {
        holdFeeEtb: 20.0,
        announcement: { active: false, message: '' },
        allowNewRegistrations: true,
      };

      settingsRes.rows.forEach((row) => {
        if (row.key === 'hold_fee_etb') settingsObj.holdFeeEtb = parseFloat(row.value);
        if (row.key === 'announcement') settingsObj.announcement = row.value;
        if (row.key === 'allow_new_registrations') settingsObj.allowNewRegistrations = !!row.value;
      });

      return NextResponse.json({
        success: true,
        stats: {
          totalPharmacies: pharmaStats.rows[0]?.total || 0,
          verifiedPharmacies: pharmaStats.rows[0]?.verified || 0,
          pendingPharmacies: pharmaStats.rows[0]?.pending || 0,
          activeSubscriptions: subStats.rows[0]?.active_subs || 0,
          totalRevenueEtb: subStats.rows[0]?.total_revenue || 0,
          totalMedicines: medStats.rows[0]?.total || 0,
          scarceMedicines: medStats.rows[0]?.scarce || 0,
          totalReservations: resStats.rows[0]?.total || 0,
          activeHolds: resStats.rows[0]?.active_holds || 0,
          totalPrescriptions: rxStats.rows[0]?.total || 0,
        },
        recentSubscriptions: recentSubsRes.rows,
        recentReservations: recentResRes.rows,
        settings: settingsObj,
      });
    } catch (err: any) {
      console.error('[API Admin Overview DB Error]:', err);
    } finally {
      client.release();
    }
  }

  // Local mock fallback
  return NextResponse.json({
    success: true,
    stats: {
      totalPharmacies: MOCK_PHARMACIES.length,
      verifiedPharmacies: MOCK_PHARMACIES.filter((p) => p.isVerified).length,
      pendingPharmacies: 1,
      activeSubscriptions: MOCK_PHARMACY_SUBSCRIPTIONS.length,
      totalRevenueEtb: MOCK_PHARMACY_SUBSCRIPTIONS.reduce((acc, s) => acc + s.pricePaidEtb, 0),
      totalMedicines: MOCK_MEDICINES.length,
      scarceMedicines: MOCK_MEDICINES.filter((m) => m.isScarce).length,
      totalReservations: 14,
      activeHolds: 3,
      totalPrescriptions: 2,
    },
    recentSubscriptions: MOCK_PHARMACY_SUBSCRIPTIONS,
    recentReservations: [],
    settings: DEFAULT_PLATFORM_SETTINGS,
  });
}
