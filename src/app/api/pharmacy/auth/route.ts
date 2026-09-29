import { NextRequest, NextResponse } from 'next/server';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import { hashPassword, verifyPassword } from '@/lib/auth';
import { ADDIS_SUB_CITIES, MOCK_PHARMACIES } from '@/lib/constants';

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
    // ACTION: REGISTER NEW PHARMACY ADMIN
    // ==========================================
    if (action === 'register') {
      const {
        adminName,
        pharmacyName,
        pharmacyAddress,
        subCity = 'Bole',
        woreda = 'Woreda 01',
        phoneNumber,
        password,
        licenseNumber,
        is24Hours = false,
      } = body;

      if (!adminName || !pharmacyName || !pharmacyAddress || !phoneNumber || !password) {
        return NextResponse.json(
          { error: 'Please provide admin name, pharmacy name, address, phone number, and password.' },
          { status: 400 }
        );
      }

      if (password.length < 4) {
        return NextResponse.json(
          { error: 'Password must be at least 4 characters long.' },
          { status: 400 }
        );
      }

      const formattedPhone = normalizePhone(phoneNumber);
      const generatedLicense =
        licenseNumber?.trim() || `EFDA-AA-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

      // Locate coordinates from sub-city with minor offset
      const subCityObj = ADDIS_SUB_CITIES.find(
        (s) => s.id.toLowerCase() === subCity.toLowerCase() || s.nameEn.toLowerCase() === subCity.toLowerCase()
      ) || ADDIS_SUB_CITIES[0];

      // Add a slight random offset (within ~300 meters) so pins don't overlap exactly
      const lat = subCityObj.lat + (Math.random() - 0.5) * 0.005;
      const lng = subCityObj.lng + (Math.random() - 0.5) * 0.005;

      const hashedPassword = hashPassword(password);

      if (pool) {
        const client = await pool.connect();
        try {
          // 1. Create or update user
          let userRes = await client.query(
            `
            INSERT INTO users (phone_number, full_name, password_hash, role)
            VALUES ($1, $2, $3, 'pharmacy_admin')
            ON CONFLICT (phone_number) 
            DO UPDATE SET 
              full_name = EXCLUDED.full_name,
              password_hash = EXCLUDED.password_hash,
              role = 'pharmacy_admin',
              updated_at = CURRENT_TIMESTAMP
            RETURNING id, full_name, phone_number, role;
          `,
            [formattedPhone, adminName.trim(), hashedPassword]
          );

          const user = userRes.rows[0];

          // 2. Create pharmacy profile
          let pharmacyRes = await client.query(
            `
            INSERT INTO pharmacies (
              owner_id,
              name,
              license_number,
              sub_city,
              woreda,
              street_address,
              phone_number,
              is_24_hours,
              latitude,
              longitude,
              is_verified,
              verification_status,
              rating
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, TRUE, 'approved', 5.0
            )
            ON CONFLICT (license_number)
            DO UPDATE SET
              name = EXCLUDED.name,
              sub_city = EXCLUDED.sub_city,
              street_address = EXCLUDED.street_address,
              phone_number = EXCLUDED.phone_number,
              owner_id = EXCLUDED.owner_id
            RETURNING id, name, license_number, sub_city, woreda, street_address, phone_number, is_24_hours;
          `,
            [
              user.id,
              pharmacyName.trim(),
              generatedLicense,
              subCityObj.nameEn,
              woreda.trim(),
              pharmacyAddress.trim(),
              formattedPhone,
              !!is24Hours,
              lat,
              lng,
            ]
          );

          const pharmacy = pharmacyRes.rows[0];

          return NextResponse.json({
            success: true,
            user: {
              id: user.id,
              name: user.full_name,
              phoneNumber: user.phone_number,
              role: user.role,
            },
            pharmacy: {
              id: pharmacy.id,
              name: pharmacy.name,
              licenseNumber: pharmacy.license_number,
              subCity: pharmacy.sub_city,
              woreda: pharmacy.woreda,
              streetAddress: pharmacy.street_address,
              phoneNumber: pharmacy.phone_number,
              is24Hours: pharmacy.is_24_hours,
            },
            message: 'Pharmacy registered successfully! You can now manage your stock inventory.',
          });
        } finally {
          client.release();
        }
      }

      // Offline / Mock fallback
      const mockId = 'pharma-custom-' + Date.now();
      return NextResponse.json({
        success: true,
        user: {
          id: 'user-' + Date.now(),
          name: adminName,
          phoneNumber: formattedPhone,
          role: 'pharmacy_admin',
        },
        pharmacy: {
          id: mockId,
          name: pharmacyName,
          licenseNumber: generatedLicense,
          subCity: subCityObj.nameEn,
          woreda,
          streetAddress: pharmacyAddress,
          phoneNumber: formattedPhone,
          is24Hours,
        },
        message: 'Pharmacy registered (local mode).',
      });
    }

    // ==========================================
    // ACTION: LOGIN PHARMACY ADMIN
    // ==========================================
    if (action === 'login') {
      const { identifier, password } = body;

      if (!identifier || !password) {
        return NextResponse.json(
          { error: 'Please enter phone number (or pharmacy name) and password.' },
          { status: 400 }
        );
      }

      const cleanInput = identifier.trim();
      const formattedPhone = normalizePhone(cleanInput);

      if (pool) {
        const client = await pool.connect();
        try {
          // Look for user by phone or email
          const userRes = await client.query(
            `
            SELECT u.*, p.id AS pharmacy_id, p.name AS pharmacy_name, p.license_number, p.sub_city, p.woreda, p.street_address, p.phone_number AS pharmacy_phone, p.is_24_hours
            FROM users u
            LEFT JOIN pharmacies p ON p.owner_id = u.id
            WHERE u.phone_number = $1 OR u.email ILIKE $2 OR p.name ILIKE $2 OR p.phone_number = $1
            ORDER BY u.created_at DESC
            LIMIT 1;
          `,
            [formattedPhone, cleanInput]
          );

          if (userRes.rows.length === 0) {
            // Check directly in pharmacies table if user created directly
            const directPharmaRes = await client.query(
              `
              SELECT p.*, u.password_hash, u.full_name AS admin_name
              FROM pharmacies p
              LEFT JOIN users u ON p.owner_id = u.id
              WHERE p.phone_number = $1 OR p.name ILIKE $2 OR p.license_number ILIKE $2
              LIMIT 1;
            `,
              [formattedPhone, cleanInput]
            );

            if (directPharmaRes.rows.length === 0) {
              return NextResponse.json(
                { error: 'No pharmacy found matching this phone number or name.' },
                { status: 404 }
              );
            }

            const p = directPharmaRes.rows[0];
            const isValid = verifyPassword(password, p.password_hash);
            if (!isValid) {
              return NextResponse.json(
                { error: 'Incorrect password. Please verify and try again.' },
                { status: 401 }
              );
            }

            return NextResponse.json({
              success: true,
              user: {
                id: p.owner_id || p.id,
                name: p.admin_name || p.name,
                phoneNumber: p.phone_number,
                role: 'pharmacy_admin',
              },
              pharmacy: {
                id: p.id,
                name: p.name,
                licenseNumber: p.license_number,
                subCity: p.sub_city,
                woreda: p.woreda,
                streetAddress: p.street_address,
                phoneNumber: p.phone_number,
                is24Hours: p.is_24_hours,
              },
              message: `Welcome back to ${p.name}!`,
            });
          }

          const row = userRes.rows[0];
          const isValid = verifyPassword(password, row.password_hash);
          if (!isValid) {
            return NextResponse.json(
              { error: 'Incorrect password. Please verify and try again.' },
              { status: 401 }
            );
          }

          // If pharmacy wasn't attached by owner_id, try to find by phone
          let pharmacyData = null;
          if (row.pharmacy_id) {
            pharmacyData = {
              id: row.pharmacy_id,
              name: row.pharmacy_name,
              licenseNumber: row.license_number,
              subCity: row.sub_city,
              woreda: row.woreda,
              streetAddress: row.street_address,
              phoneNumber: row.pharmacy_phone,
              is24Hours: row.is_24_hours,
            };
          } else {
            const fallbackPharma = await client.query(
              `SELECT id, name, license_number, sub_city, woreda, street_address, phone_number, is_24_hours FROM pharmacies WHERE phone_number = $1 OR name ILIKE $2 LIMIT 1;`,
              [row.phone_number, row.full_name]
            );
            if (fallbackPharma.rows.length > 0) {
              const fp = fallbackPharma.rows[0];
              pharmacyData = {
                id: fp.id,
                name: fp.name,
                licenseNumber: fp.license_number,
                subCity: fp.sub_city,
                woreda: fp.woreda,
                streetAddress: fp.street_address,
                phoneNumber: fp.phone_number,
                is24Hours: fp.is_24_hours,
              };
            }
          }

          if (!pharmacyData) {
            // Pick default first pharmacy if none mapped
            const firstPharma = await client.query(`SELECT id, name, license_number, sub_city, woreda, street_address, phone_number, is_24_hours FROM pharmacies LIMIT 1;`);
            pharmacyData = firstPharma.rows[0];
          }

          return NextResponse.json({
            success: true,
            user: {
              id: row.id,
              name: row.full_name,
              phoneNumber: row.phone_number,
              role: row.role,
            },
            pharmacy: pharmacyData,
            message: `Welcome back, ${row.full_name}!`,
          });
        } finally {
          client.release();
        }
      }

      // Mock demo match
      const matched = MOCK_PHARMACIES.find(
        (p) => p.name.toLowerCase().includes(cleanInput.toLowerCase()) || p.phoneNumber.includes(cleanInput)
      ) || MOCK_PHARMACIES[0];

      return NextResponse.json({
        success: true,
        user: {
          id: 'user-mock-1',
          name: matched.name + ' Admin',
          phoneNumber: matched.phoneNumber,
          role: 'pharmacy_admin',
        },
        pharmacy: matched,
        message: `Welcome back to ${matched.name}!`,
      });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    console.error('[API Pharmacy Auth Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
