import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import { isMemoryDb } from './runtime.js';

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

function parseBooleanEnv(value: string | undefined): boolean | undefined {
if (!value) return undefined;
const normalized = value.trim().toLowerCase();
if (['1', 'true', 'yes', 'y', 'on'].includes(normalized)) return true;
if (['0', 'false', 'no', 'n', 'off'].includes(normalized)) return false;
return undefined;
}

function shouldUseSsl(
connectionString: string | undefined
): boolean | { rejectUnauthorized: false } | undefined {
const forced = parseBooleanEnv(process.env.DB_SSL);
if (forced === true) return { rejectUnauthorized: false };
if (forced === false) return false;

if (!connectionString) return undefined;

try {
const url = new URL(connectionString);
const sslmode = url.searchParams.get('sslmode')?.toLowerCase();
if (sslmode && sslmode !== 'disable') return { rejectUnauthorized: false };

const host = url.hostname.toLowerCase();
const isLocalHost = host === 'localhost' || host === '127.0.0.1' || host === '::1';
if (isLocalHost) return undefined;
} catch {
// If the URL is not parseable, fall back to NODE_ENV heuristics below.
}

if (process.env.NODE_ENV === 'production') return { rejectUnauthorized: false };
return undefined;
}

function dbDisabledError(): Error {
return new Error(
'Database is disabled or not configured. Set DB_MODE=memory for dev-only, or configure Postgres via DATABASE_URL (Render) or DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD.'
);
}

const connectionString = process.env.DATABASE_URL ?? process.env.DB_CONNECTION_STRING;
const ssl = shouldUseSsl(connectionString);

export const pool = isMemoryDb
? null
: new Pool(
connectionString
? {
connectionString,
ssl,
max: 20,
idleTimeoutMillis: 30000,
connectionTimeoutMillis: 2000,
}
: {
host: process.env.DB_HOST ?? 'localhost',
port: Number(process.env.DB_PORT ?? 5432),
database: process.env.DB_NAME ?? 'hireflow',
user: process.env.DB_USER ?? 'postgres',
password: process.env.DB_PASSWORD ?? 'postgres',
ssl,
max: 20,
idleTimeoutMillis: 30000,
connectionTimeoutMillis: 2000,
}
);

if (pool) {
pool.on('error', (err) => {
console.error('[DB] Unexpected error on idle client', err);
});
}

export async function query<T>(text: string, params?: unknown[]): Promise<T[]> {
if (!pool) throw dbDisabledError();
const result = await pool.query(text, params);
return result.rows as T[];
}

export async function queryOne<T>(text: string, params?: unknown[]): Promise<T | null> {
if (!pool) throw dbDisabledError();
const result = await pool.query(text, params);
return (result.rows[0] as T) ?? null;
}

export async function execute(text: string, params?: unknown[]): Promise<number> {
if (!pool) throw dbDisabledError();
const result = await pool.query(text, params);
return result.rowCount ?? 0;
}
