/**
 * Database Connection
 * ──────────────────
 * PostgreSQL connection using node-postgres (pg)
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import { isMemoryDb } from './runtime.js';

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

function parseBool(value: string | undefined): boolean {
  if (!value) return false;
  return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase());
}

const DATABASE_URL = process.env.DATABASE_URL;
const hasPartsConfig = Boolean(process.env.DB_HOST || process.env.DB_NAME || process.env.DB_USER);
const isProd = process.env.NODE_ENV === 'production';

if (!isMemoryDb && isProd && !DATABASE_URL && !hasPartsConfig) {
  throw new Error('Missing database config: set DATABASE_URL (recommended) or DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD');
}

const wantsSsl =
  parseBool(process.env.DB_SSL) ||
  (typeof DATABASE_URL === 'string' && DATABASE_URL.length > 0 && !DATABASE_URL.includes('localhost'));


export const pool = isMemoryDb
  ? null
  : new Pool({
      connectionString: DATABASE_URL,
      host:     DATABASE_URL ? undefined : (process.env.DB_HOST ?? 'localhost'),
      port:     DATABASE_URL ? undefined : Number(process.env.DB_PORT ?? 5432),
      database: DATABASE_URL ? undefined : (process.env.DB_NAME ?? 'hireflow'),
      user:     DATABASE_URL ? undefined : (process.env.DB_USER ?? 'postgres'),
      password: DATABASE_URL ? undefined : (process.env.DB_PASSWORD ?? 'postgres'),
      ssl:      wantsSsl ? { rejectUnauthorized: false } : undefined,
      max:      20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });


if (pool) {
  pool.on('error', (err) => {
    console.error('[DB] Unexpected error on idle client', err);
  });
}

export async function query<T>(text: string, params?: unknown[]): Promise<T[]> {
  if (!pool) throw new Error('Database disabled (DB_MODE=memory)');
  const result = await pool.query(text, params);
  return result.rows as T[];
}

export async function queryOne<T>(text: string, params?: unknown[]): Promise<T | null> {
  if (!pool) throw new Error('Database disabled (DB_MODE=memory)');
  const result = await pool.query(text, params);
  return (result.rows[0] as T) ?? null;
}

export async function execute(text: string, params?: unknown[]): Promise<number> {
  if (!pool) throw new Error('Database disabled (DB_MODE=memory)');
  const result = await pool.query(text, params);
  return result.rowCount ?? 0;
}
