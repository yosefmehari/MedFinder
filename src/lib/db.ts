import 'server-only';
import { Pool, neon, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

if (typeof window === 'undefined') {
  neonConfig.webSocketConstructor = ws;
}

// Ensure this file is never bundled into client-side code
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn(
    '[MedFinder DB] Warning: DATABASE_URL environment variable is not defined. Falling back to mock data.'
  );
}

// SQL query helper using neon serverless client
export const sql = connectionString ? neon(connectionString) : null;

// Pool for transactions or compatibility if needed
export const pool = connectionString ? new Pool({ connectionString }) : null;

export async function executeQuery<T = any>(
  queryText: string,
  params: any[] = []
): Promise<T[]> {
  if (!sql) {
    throw new Error('Database connection is not configured.');
  }
  const result = await sql.query(queryText, params);
  return result as T[];
}
