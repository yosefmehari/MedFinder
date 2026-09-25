import { Pool, neonConfig } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import ws from 'ws';

// Set WebSocket constructor for Node.js environment
neonConfig.webSocketConstructor = ws;

// Load .env.local
dotenv.config({ path: '.env.local' });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ Error: DATABASE_URL is not set in .env.local');
  process.exit(1);
}

const pool = new Pool({ connectionString: databaseUrl });

async function runMigrations() {
  console.log('🚀 Connecting to Neon PostgreSQL via WebSocket Pool...');
  const client = await pool.connect();

  try {
    const migrationFiles = [
      'src/db/migrations/001_initial_schema.sql',
      'src/db/migrations/002_seed_data.sql',
    ];

    for (const relativePath of migrationFiles) {
      const fullPath = path.resolve(process.cwd(), relativePath);
      console.log(`\n📄 Running migration: ${relativePath}...`);

      if (!fs.existsSync(fullPath)) {
        console.error(`❌ Migration file not found: ${fullPath}`);
        process.exit(1);
      }

      const content = fs.readFileSync(fullPath, 'utf8');

      try {
        await client.query(content);
        console.log(`✅ Successfully executed: ${relativePath}`);
      } catch (err) {
        console.error(`❌ Error running migration ${relativePath}:`, err.message);
        if (err.detail) console.error('Detail:', err.detail);
        if (err.hint) console.error('Hint:', err.hint);
        throw err;
      }
    }

    // Quick verification query
    const pharmaRes = await client.query('SELECT COUNT(*) FROM pharmacies;');
    const medRes = await client.query('SELECT COUNT(*) FROM medicines;');
    const invRes = await client.query('SELECT COUNT(*) FROM pharmacy_inventory;');

    console.log('\n🎉 Database migrations & seeding complete!');
    console.log(`📊 Verified Pharmacies in DB: ${pharmaRes.rows[0].count}`);
    console.log(`📊 Verified Medicines in DB: ${medRes.rows[0].count}`);
    console.log(`📊 Active Stock Records in DB: ${invRes.rows[0].count}`);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations().catch((err) => {
  console.error('Fatal Migration Error:', err);
  process.exit(1);
});
