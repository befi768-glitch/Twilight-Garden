import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import { logger } from '../utils/logger';

const rawUrl = process.env.DATABASE_URL ?? '';

// Railway internal URLs (*.railway.internal) only work inside Railway's private network.
// Fall back to DATABASE_PUBLIC_URL so the bot can connect from any environment.
const isInternal =
  rawUrl.includes('localhost') ||
  rawUrl.includes('127.0.0.1') ||
  rawUrl.includes('.railway.internal');

const connectionString = isInternal
  ? (process.env.DATABASE_PUBLIC_URL ?? rawUrl)
  : rawUrl;

const useSSL =
  !connectionString.includes('localhost') &&
  !connectionString.includes('127.0.0.1');

const pool = new Pool({
  connectionString,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
  ssl: useSSL ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => {
  logger.error('PostgreSQL pool error', { error: err.message });
});

export const db = drizzle(pool, { schema });

export async function connectDatabase(): Promise<void> {
  const client = await pool.connect();
  client.release();
  logger.info('Database connected');
}

export { schema };
