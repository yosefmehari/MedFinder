import { NextRequest, NextResponse } from 'next/server';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import { DEFAULT_PLATFORM_SETTINGS } from '@/lib/constants';

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
      const res = await client.query(`SELECT key, value FROM platform_settings;`);
      const settings: Record<string, any> = { ...DEFAULT_PLATFORM_SETTINGS };

      res.rows.forEach((row) => {
        if (row.key === 'hold_fee_etb') settings.holdFeeEtb = parseFloat(row.value);
        if (row.key === 'announcement') settings.announcement = row.value;
        if (row.key === 'allow_new_registrations') settings.allowNewRegistrations = !!row.value;
      });

      return NextResponse.json({
        success: true,
        settings,
      });
    } catch (err: any) {
      console.error('[API Admin Settings GET Error]:', err);
      return NextResponse.json({ error: err.message }, { status: 500 });
    } finally {
      client.release();
    }
  }

  return NextResponse.json({
    success: true,
    settings: DEFAULT_PLATFORM_SETTINGS,
  });
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { holdFeeEtb, announcement, allowNewRegistrations } = body;

    if (pool) {
      const client = await pool.connect();
      try {
        if (typeof holdFeeEtb === 'number') {
          await client.query(
            `
            INSERT INTO platform_settings (key, value, description)
            VALUES ('hold_fee_etb', $1::jsonb, 'Standard unlock & 2-hour hold reservation fee in ETB')
            ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP;
            `,
            [JSON.stringify(holdFeeEtb)]
          );
        }

        if (announcement !== undefined) {
          await client.query(
            `
            INSERT INTO platform_settings (key, value, description)
            VALUES ('announcement', $1::jsonb, 'Global announcement ticker across MedFinder header')
            ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP;
            `,
            [JSON.stringify(announcement)]
          );
        }

        if (typeof allowNewRegistrations === 'boolean') {
          await client.query(
            `
            INSERT INTO platform_settings (key, value, description)
            VALUES ('allow_new_registrations', $1::jsonb, 'Whether new pharmacies can self-register from the portal')
            ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP;
            `,
            [JSON.stringify(allowNewRegistrations)]
          );
        }

        return NextResponse.json({
          success: true,
          message: 'Platform settings updated successfully!',
        });
      } finally {
        client.release();
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Settings updated (local mode).',
    });
  } catch (err: any) {
    console.error('[API Admin Settings PATCH Error]:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
