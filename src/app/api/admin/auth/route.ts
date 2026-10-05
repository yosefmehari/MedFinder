import { NextRequest, NextResponse } from 'next/server';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import { hashPassword, verifyPassword } from '@/lib/auth';

if (typeof window === 'undefined') {
  neonConfig.webSocketConstructor = ws;
}

const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : null;

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('251')) return '+' + digits;
  if (digits.startsWith('0')) return '+251' + digits.slice(1);
  return '+251' + digits;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action = 'login' } = body;

    // ==========================================
    // ACTION: SUPER ADMIN LOGIN
    // ==========================================
    if (action === 'login') {
      const { identifier, password } = body;

      if (!identifier || !password) {
        return NextResponse.json(
          { error: 'Please enter your admin phone number or email and password.' },
          { status: 400 }
        );
      }

      const cleanInput = identifier.trim();
      const formattedPhone = normalizePhone(cleanInput);

      if (pool) {
        const client = await pool.connect();
        try {
          const userRes = await client.query(
            `
            SELECT id, email, phone_number, full_name, password_hash, role, is_active
            FROM users
            WHERE (phone_number = $1 OR email ILIKE $2)
              AND role = 'super_admin'
            LIMIT 1;
            `,
            [formattedPhone, cleanInput]
          );

          if (userRes.rows.length === 0) {
            // Check if user exists but has different role or check if demo admin
            const anyUserRes = await client.query(
              `SELECT id, role, password_hash FROM users WHERE phone_number = $1 OR email ILIKE $2 LIMIT 1;`,
              [formattedPhone, cleanInput]
            );

            if (anyUserRes.rows.length > 0 && anyUserRes.rows[0].role !== 'super_admin') {
              return NextResponse.json(
                { error: 'Access denied: This account does not have platform Super Admin privileges.' },
                { status: 403 }
              );
            }

            // Fallback for default seed admin if not found
            if (
              cleanInput === 'admin@medfinder.et' ||
              cleanInput === '0911223344' ||
              formattedPhone === '+251911223344'
            ) {
              if (password === 'admin123' || password === 'password123') {
                return NextResponse.json({
                  success: true,
                  user: {
                    id: 'a0000000-0000-0000-0000-000000000001',
                    name: 'MedFinder SuperAdmin',
                    email: 'admin@medfinder.et',
                    phoneNumber: '+251911223344',
                    role: 'super_admin',
                  },
                  message: 'Welcome to MedFinder Super Admin Portal!',
                });
              }
            }

            return NextResponse.json(
              { error: 'Invalid admin credentials or account not found.' },
              { status: 401 }
            );
          }

          const user = userRes.rows[0];

          if (!user.is_active) {
            return NextResponse.json(
              { error: 'Admin account has been suspended.' },
              { status: 403 }
            );
          }

          const isMatch = verifyPassword(password, user.password_hash);
          if (!isMatch) {
            return NextResponse.json(
              { error: 'Incorrect admin password. Please try again.' },
              { status: 401 }
            );
          }

          return NextResponse.json({
            success: true,
            user: {
              id: user.id,
              name: user.full_name || 'MedFinder SuperAdmin',
              email: user.email || 'admin@medfinder.et',
              phoneNumber: user.phone_number,
              role: user.role,
            },
            message: 'Super Admin authentication successful!',
          });
        } finally {
          client.release();
        }
      }

      // Mock offline fallback
      if (password === 'admin123' || password === 'password123') {
        return NextResponse.json({
          success: true,
          user: {
            id: 'mock-super-admin',
            name: 'MedFinder SuperAdmin',
            email: 'admin@medfinder.et',
            phoneNumber: '+251911223344',
            role: 'super_admin',
          },
          message: 'Super Admin logged in (local fallback mode).',
        });
      }

      return NextResponse.json(
        { error: 'Invalid admin credentials.' },
        { status: 401 }
      );
    }

    // ==========================================
    // ACTION: CHANGE ADMIN PASSWORD
    // ==========================================
    if (action === 'change_password') {
      const { userId, newPassword } = body;
      if (!userId || !newPassword || newPassword.length < 4) {
        return NextResponse.json(
          { error: 'New password must be at least 4 characters long.' },
          { status: 400 }
        );
      }

      const newHash = hashPassword(newPassword);

      if (pool) {
        const client = await pool.connect();
        try {
          await client.query(
            `UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND role = 'super_admin'`,
            [newHash, userId]
          );
          return NextResponse.json({
            success: true,
            message: 'Admin password updated successfully!',
          });
        } finally {
          client.release();
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Password updated (local mode).',
      });
    }

    return NextResponse.json({ error: 'Invalid action requested.' }, { status: 400 });
  } catch (error: any) {
    console.error('[API Admin Auth Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
