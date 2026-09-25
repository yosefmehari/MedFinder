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
    const { patientName, patientPhone, imageUrl, notes, preferredSubCity } = body;

    if (!patientPhone) {
      return NextResponse.json(
        { error: 'Patient phone number is required' },
        { status: 400 }
      );
    }

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
          RETURNING id, patient_name, patient_phone, status, created_at;
        `;
        const res = await client.query(queryText, [
          patientName || 'Anonymous Patient',
          patientPhone,
          imageUrl || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=400',
          notes || '',
          preferredSubCity || 'bole',
        ]);

        return NextResponse.json({
          success: true,
          prescription: res.rows[0],
          message: 'Prescription uploaded and broadcasted to local Addis Ababa pharmacies.',
        });
      } finally {
        client.release();
      }
    }

    return NextResponse.json({
      success: true,
      prescription: {
        id: 'rx-mock-1',
        patient_name: patientName,
        patient_phone: patientPhone,
        status: 'submitted',
      },
      message: 'Prescription recorded (mock mode).',
    });
  } catch (error: any) {
    console.error('[API Prescriptions Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
