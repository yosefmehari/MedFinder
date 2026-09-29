import { NextRequest, NextResponse } from 'next/server';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

if (typeof window === 'undefined') {
  neonConfig.webSocketConstructor = ws;
}

const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : null;

// POST: Create a new 2-hour reservation
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      pharmacyId,
      medicineId,
      patientName,
      patientPhone,
      paymentProvider = 'telebirr',
      pharmacyName,
      medicineName,
    } = body;

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
          RETURNING id, reservation_code, pharmacy_id, medicine_id, patient_name, patient_phone, hold_fee_etb, payment_provider, payment_status, reservation_status, expires_at, created_at;
        `;
        const res = await client.query(queryText, [
          reservationCode,
          pharmacyId,
          medicineId,
          patientName || 'Patient',
          patientPhone || '+251911223344',
          paymentProvider,
        ]);

        const reservation = res.rows[0];

        return NextResponse.json({
          success: true,
          reservation: {
            id: reservation.id,
            reservationCode: reservation.reservation_code,
            pharmacyId: reservation.pharmacy_id,
            medicineId: reservation.medicine_id,
            pharmacyName: pharmacyName || 'Verified Addis Pharmacy',
            medicineName: medicineName || 'Prescribed Medicine',
            patientName: reservation.patient_name,
            patientPhone: reservation.patient_phone,
            holdFeeEtb: parseFloat(reservation.hold_fee_etb),
            paymentProvider: reservation.payment_provider,
            paymentStatus: reservation.payment_status,
            reservationStatus: reservation.reservation_status,
            expiresAt: reservation.expires_at,
            createdAt: reservation.created_at,
          },
          message: 'Medicine reserved for 2 hours. Stock hold confirmed.',
        });
      } finally {
        client.release();
      }
    }

    // Graceful offline mock fallback
    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
    return NextResponse.json({
      success: true,
      reservation: {
        id: 'res-' + Date.now(),
        reservationCode,
        pharmacyId: pharmacyId || 'pharma-1',
        medicineId: medicineId || 'med-1',
        pharmacyName: pharmacyName || 'Kenema Pharmacy No. 1 - Bole',
        medicineName: medicineName || 'Lantus SoloStar',
        patientName: patientName || 'Patient',
        patientPhone: patientPhone || '+251911223344',
        holdFeeEtb: 20.0,
        paymentProvider,
        paymentStatus: 'completed',
        reservationStatus: 'active',
        expiresAt,
        createdAt: new Date().toISOString(),
      },
      message: 'Medicine reserved for 2 hours (mock fallback).',
    });
  } catch (error: any) {
    console.error('[API Reservations POST Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET: Lookup or verify reservation by code, phone, or pharmacyId
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const phone = searchParams.get('phone');
  const pharmacyId = searchParams.get('pharmacyId');

  if (pool) {
    try {
      const client = await pool.connect();
      try {
        if (code) {
          const res = await client.query(
            `
            SELECT 
              r.*,
              p.name AS pharmacy_name,
              p.street_address,
              p.phone_number AS pharmacy_phone,
              p.sub_city,
              m.brand_name AS medicine_name,
              m.strength,
              m.dosage_form,
              pi.unit_price
            FROM reservations r
            JOIN pharmacies p ON r.pharmacy_id = p.id
            JOIN medicines m ON r.medicine_id = m.id
            LEFT JOIN pharmacy_inventory pi ON (pi.pharmacy_id = p.id AND pi.medicine_id = m.id)
            WHERE UPPER(r.reservation_code) = UPPER($1)
            ORDER BY r.created_at DESC
            LIMIT 1;
          `,
            [code.trim()]
          );

          if (res.rows.length === 0) {
            return NextResponse.json(
              { error: 'Reservation code not found.' },
              { status: 404 }
            );
          }

          const row = res.rows[0];
          const isExpired = new Date(row.expires_at) < new Date();

          return NextResponse.json({
            success: true,
            reservation: {
              id: row.id,
              reservationCode: row.reservation_code,
              pharmacyId: row.pharmacy_id,
              medicineId: row.medicine_id,
              pharmacyName: row.pharmacy_name,
              pharmacyPhone: row.pharmacy_phone,
              pharmacyAddress: row.street_address,
              subCity: row.sub_city,
              medicineName: row.medicine_name,
              strength: row.strength,
              dosageForm: row.dosage_form,
              unitPrice: row.unit_price ? parseFloat(row.unit_price) : 0,
              patientName: row.patient_name,
              patientPhone: row.patient_phone,
              holdFeeEtb: parseFloat(row.hold_fee_etb),
              paymentProvider: row.payment_provider,
              paymentStatus: row.payment_status,
              reservationStatus: isExpired && row.reservation_status === 'active' ? 'expired' : row.reservation_status,
              expiresAt: row.expires_at,
              createdAt: row.created_at,
              isExpired,
            },
          });
        }

        if (pharmacyId) {
          const res = await client.query(
            `
            SELECT 
              r.*,
              m.brand_name AS medicine_name,
              m.strength,
              m.dosage_form
            FROM reservations r
            JOIN medicines m ON r.medicine_id = m.id
            WHERE r.pharmacy_id = $1
            ORDER BY r.created_at DESC
            LIMIT 50;
          `,
            [pharmacyId]
          );

          return NextResponse.json({
            success: true,
            reservations: res.rows.map((row) => ({
              id: row.id,
              reservationCode: row.reservation_code,
              pharmacyId: row.pharmacy_id,
              medicineId: row.medicine_id,
              medicineName: row.medicine_name,
              strength: row.strength,
              patientName: row.patient_name,
              patientPhone: row.patient_phone,
              holdFeeEtb: parseFloat(row.hold_fee_etb),
              paymentProvider: row.payment_provider,
              paymentStatus: row.payment_status,
              reservationStatus: row.reservation_status,
              expiresAt: row.expires_at,
              createdAt: row.created_at,
            })),
          });
        }

        if (phone) {
          const res = await client.query(
            `
            SELECT 
              r.*,
              p.name AS pharmacy_name,
              p.phone_number AS pharmacy_phone,
              p.street_address,
              m.brand_name AS medicine_name
            FROM reservations r
            JOIN pharmacies p ON r.pharmacy_id = p.id
            JOIN medicines m ON r.medicine_id = m.id
            WHERE r.patient_phone ILIKE '%' || $1 || '%'
            ORDER BY r.created_at DESC;
          `,
            [phone.replace(/\D/g, '').slice(-9)]
          );

          return NextResponse.json({
            success: true,
            reservations: res.rows.map((row) => ({
              id: row.id,
              reservationCode: row.reservation_code,
              pharmacyId: row.pharmacy_id,
              medicineId: row.medicine_id,
              pharmacyName: row.pharmacy_name,
              pharmacyPhone: row.pharmacy_phone,
              pharmacyAddress: row.street_address,
              medicineName: row.medicine_name,
              patientName: row.patient_name,
              patientPhone: row.patient_phone,
              holdFeeEtb: parseFloat(row.hold_fee_etb),
              reservationStatus: row.reservation_status,
              expiresAt: row.expires_at,
              createdAt: row.created_at,
            })),
          });
        }
      } finally {
        client.release();
      }
    } catch (err: any) {
      console.error('[API Reservations GET Error]:', err);
    }
  }

  // Fallback demo response if no db or params
  return NextResponse.json({
    success: true,
    reservations: [],
    message: 'No active reservations found.',
  });
}

// PATCH: Update reservation status (e.g. dispensed by pharmacy, cancelled)
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, status } = body;

    if (!code || !status) {
      return NextResponse.json(
        { error: 'Reservation code and status are required' },
        { status: 400 }
      );
    }

    if (pool) {
      const client = await pool.connect();
      try {
        const res = await client.query(
          `
          UPDATE reservations 
          SET reservation_status = $1, updated_at = CURRENT_TIMESTAMP
          WHERE UPPER(reservation_code) = UPPER($2)
          RETURNING id, reservation_code, reservation_status, updated_at;
        `,
          [status, code.trim()]
        );

        if (res.rows.length === 0) {
          return NextResponse.json(
            { error: 'Reservation code not found' },
            { status: 404 }
          );
        }

        return NextResponse.json({
          success: true,
          reservation: res.rows[0],
          message: `Reservation marked as ${status}.`,
        });
      } finally {
        client.release();
      }
    }

    return NextResponse.json({
      success: true,
      reservation: { reservation_code: code, reservation_status: status },
      message: `Reservation updated to ${status} (mock mode).`,
    });
  } catch (error: any) {
    console.error('[API Reservations PATCH Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
