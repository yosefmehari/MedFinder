import { NextRequest, NextResponse } from 'next/server';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

if (typeof window === 'undefined') {
  neonConfig.webSocketConstructor = ws;
}

const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : null;

// POST: Patient uploads prescription
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { patientName, patientPhone, imageUrl, notes, preferredSubCity } = body;

    if (!patientPhone) {
      return NextResponse.json(
        { error: 'Patient phone number is required' },
        { status: 400 }
      );
    }

    const defaultImage =
      'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=400';

    if (pool) {
      const client = await pool.connect();
      try {
        const queryText = `
          INSERT INTO prescriptions (
            patient_name,
            patient_phone,
            image_url,
            notes,
            preferred_sub_city,
            status
          ) VALUES ($1, $2, $3, $4, $5, 'submitted')
          RETURNING id, patient_name, patient_phone, image_url, notes, preferred_sub_city, status, created_at;
        `;
        const res = await client.query(queryText, [
          patientName || 'Anonymous Patient',
          patientPhone,
          imageUrl || defaultImage,
          notes || '',
          preferredSubCity || 'bole',
        ]);

        const rx = res.rows[0];

        return NextResponse.json({
          success: true,
          prescription: {
            id: rx.id,
            patientName: rx.patient_name,
            patientPhone: rx.patient_phone,
            imageUrl: rx.image_url,
            notes: rx.notes,
            preferredSubCity: rx.preferred_sub_city,
            status: rx.status,
            createdAt: rx.created_at,
          },
          message: 'Prescription uploaded and broadcasted to local Addis Ababa pharmacies.',
        });
      } finally {
        client.release();
      }
    }

    return NextResponse.json({
      success: true,
      prescription: {
        id: 'rx-' + Date.now(),
        patientName: patientName || 'Anonymous Patient',
        patientPhone: patientPhone,
        imageUrl: imageUrl || defaultImage,
        notes: notes || '',
        preferredSubCity: preferredSubCity || 'bole',
        status: 'submitted',
        createdAt: new Date().toISOString(),
      },
      message: 'Prescription recorded (mock mode).',
    });
  } catch (error: any) {
    console.error('[API Prescriptions POST Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET: Pharmacy retrieves prescription broadcasts to review & fulfill
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const subCity = searchParams.get('subCity');
  const status = searchParams.get('status');

  if (pool) {
    try {
      const client = await pool.connect();
      try {
        let queryText = `
          SELECT id, patient_name, patient_phone, image_url, notes, preferred_sub_city, status, created_at
          FROM prescriptions
          WHERE 1=1
        `;
        const params: any[] = [];

        if (subCity && subCity !== 'all') {
          params.push(subCity);
          queryText += ` AND (preferred_sub_city ILIKE '%' || $${params.length} || '%')`;
        }

        if (status) {
          params.push(status);
          queryText += ` AND status = $${params.length}`;
        }

        queryText += ` ORDER BY created_at DESC LIMIT 30;`;

        const res = await client.query(queryText, params);

        return NextResponse.json({
          success: true,
          prescriptions: res.rows.map((row) => ({
            id: row.id,
            patientName: row.patient_name,
            patientPhone: row.patient_phone,
            imageUrl: row.image_url,
            notes: row.notes,
            preferredSubCity: row.preferred_sub_city,
            status: row.status,
            createdAt: row.created_at,
          })),
        });
      } finally {
        client.release();
      }
    } catch (err: any) {
      console.error('[API Prescriptions GET Error]:', err);
    }
  }

  // Fallback demo mock prescriptions for UI testing
  return NextResponse.json({
    success: true,
    prescriptions: [
      {
        id: 'rx-demo-1',
        patientName: 'Abebe Bekele',
        patientPhone: '+251911445566',
        imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=400',
        notes: 'Needs 2 packs of Lantus SoloStar 100 IU/ml. Urgently required for diabetic elder.',
        preferredSubCity: 'bole',
        status: 'submitted',
        createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      },
      {
        id: 'rx-demo-2',
        patientName: 'Tigist Haile',
        patientPhone: '+251922778899',
        imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=400',
        notes: 'Salbutamol / Ventolin inhaler prescription for acute asthma.',
        preferredSubCity: 'kirkos',
        status: 'submitted',
        createdAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
      },
    ],
  });
}

// PATCH: Update prescription status
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json(
        { error: 'Prescription ID and status are required' },
        { status: 400 }
      );
    }

    if (pool) {
      const client = await pool.connect();
      try {
        const res = await client.query(
          `
          UPDATE prescriptions 
          SET status = $1, updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
          RETURNING id, status, updated_at;
        `,
          [status, id]
        );

        if (res.rows.length === 0) {
          return NextResponse.json({ error: 'Prescription not found' }, { status: 404 });
        }

        return NextResponse.json({
          success: true,
          prescription: res.rows[0],
          message: `Prescription marked as ${status}.`,
        });
      } finally {
        client.release();
      }
    }

    return NextResponse.json({
      success: true,
      prescription: { id, status },
      message: `Prescription updated to ${status} (mock mode).`,
    });
  } catch (error: any) {
    console.error('[API Prescriptions PATCH Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
