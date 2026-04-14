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

export const pool = isMemoryDb
  ? null
  : new Pool({
      host:     process.env.DB_HOST     ?? 'localhost',
      port:     Number(process.env.DB_PORT ?? 5432),
      database: process.env.DB_NAME     ?? 'hireflow',
      user:     process.env.DB_USER     ?? 'postgres',
      password: process.env.DB_PASSWORD ?? 'postgres',
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
