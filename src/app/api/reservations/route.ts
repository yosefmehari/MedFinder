import { NextRequest, NextResponse } from 'next/server';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

if (typeof window === 'undefined') {
  neonConfig.webSocketConstructor = ws;
}

const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : null;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { pharmacyId, medicineId, patientName, patientPhone, paymentProvider } = body;

    const reservationCode = 'MED-' + Math.floor(1000 + Math.random() * 9000);

    if (pool && pharmacyId && medicineId) {
      const client = await pool.connect();
      try {
        const queryText = `
          INSERT INTO reservations (
            reservation_code,
            pharmacy_id,
            medicine_id,
            patient_name,
            patient_phone,
            hold_fee_etb,
            payment_provider,
            payment_status,
            reservation_status,
            expires_at
          ) VALUES (
            $1, $2, $3, $4, $5, 20.00, $6, 'completed', 'active',
            CURRENT_TIMESTAMP + INTERVAL '2 hours'
          )
          RETURNING id, reservation_code, expires_at;
        `;
        const res = await client.query(queryText, [
          reservationCode,
          pharmacyId,
          medicineId,
          patientName || 'Patient',
          patientPhone || '+251911223344',
          paymentProvider || 'telebirr',
        ]);

        return NextResponse.json({
          success: true,
          reservation: res.rows[0],
          message: 'Medicine reserved for 2 hours. Stock holds active.',
        });
      } finally {
        client.release();
      }
    }

    return NextResponse.json({
      success: true,
      reservation: {
        reservation_code: reservationCode,
        expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      },
      message: 'Medicine reserved for 2 hours (mock fallback).',
    });
  } catch (error: any) {
    console.error('[API Reservations Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
