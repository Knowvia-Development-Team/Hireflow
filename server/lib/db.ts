@@
-import { fileURLToPath } from 'url';
+import { fileURLToPath } from 'url';
 import pg from 'pg';
 import { isMemoryDb } from './runtime.js';
@@
-function parseBool(value: string | undefined): boolean {
-  if (!value) return false;
-  return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase());
-}
-
-const DATABASE_URL = process.env.DATABASE_URL;
+function parseBool(value: string | undefined): boolean | undefined {
+  if (!value) return undefined;
+  const normalized = value.trim().toLowerCase();
+  if (['1', 'true', 'yes', 'y', 'on'].includes(normalized)) return true;
+  if (['0', 'false', 'no', 'n', 'off'].includes(normalized)) return false;
+  return undefined;
+}
+
+const DATABASE_URL = process.env.DATABASE_URL ?? process.env.DB_CONNECTION_STRING;
 const hasPartsConfig = Boolean(process.env.DB_HOST || process.env.DB_NAME || process.env.DB_USER);
 const isProd = process.env.NODE_ENV === 'production';
@@
-const wantsSsl =
-  parseBool(process.env.DB_SSL) ||
-  (typeof DATABASE_URL === 'string' && DATABASE_URL.length > 0 && !DATABASE_URL.includes('localhost'));
+function wantsSsl(connectionString: string | undefined): { rejectUnauthorized: false } | undefined {
+  const forced = parseBool(process.env.DB_SSL);
+  if (forced === true) return { rejectUnauthorized: false };
+  if (forced === false) return undefined;
+  if (!connectionString) return undefined;
+  try {
+    const url = new URL(connectionString);
+    const sslmode = url.searchParams.get('sslmode')?.toLowerCase();
+    if (sslmode && sslmode !== 'disable') return { rejectUnauthorized: false };
+    const host = url.hostname.toLowerCase();
+    const isLocalHost = host === 'localhost' || host === '127.0.0.1' || host === '::1';
+    if (isLocalHost) return undefined;
+  } catch {}
+  return isProd ? { rejectUnauthorized: false } : undefined;
+}
+
+function dbDisabledError(): Error {
+  return new Error(
+    'Database is disabled or not configured. Set DB_MODE=memory for dev-only, or configure Postgres via DATABASE_URL (Render) or DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD.'
+  );
+}
@@
 export const pool = isMemoryDb
   ? null
   : new Pool({
-      connectionString: DATABASE_URL,
-      host:     DATABASE_URL ? undefined : (process.env.DB_HOST ?? 'localhost'),
-      port:     DATABASE_URL ? undefined : Number(process.env.DB_PORT ?? 5432),
-      database: DATABASE_URL ? undefined : (process.env.DB_NAME ?? 'hireflow'),
-      user:     DATABASE_URL ? undefined : (process.env.DB_USER ?? 'postgres'),
-      password: DATABASE_URL ? undefined : (process.env.DB_PASSWORD ?? 'postgres'),
-      ssl:      wantsSsl ? { rejectUnauthorized: false } : undefined,
+      ...(DATABASE_URL
+        ? { connectionString: DATABASE_URL }
+        : {
+            host: process.env.DB_HOST ?? 'localhost',
+            port: Number(process.env.DB_PORT ?? 5432),
+            database: process.env.DB_NAME ?? 'hireflow',
+            user: process.env.DB_USER ?? 'postgres',
+            password: process.env.DB_PASSWORD ?? 'postgres',
+          }),
+      ssl: wantsSsl(DATABASE_URL),
       max:      20,
       idleTimeoutMillis: 30000,
       connectionTimeoutMillis: 2000,
     });
@@
 export async function query<T>(text: string, params?: unknown[]): Promise<T[]> {
-  if (!pool) throw new Error('Database disabled (DB_MODE=memory)');
+  if (!pool) throw dbDisabledError();
   const result = await pool.query(text, params);
   return result.rows as T[];
 }
@@
 export async function queryOne<T>(text: string, params?: unknown[]): Promise<T | null> {
-  if (!pool) throw new Error('Database disabled (DB_MODE=memory)');
+  if (!pool) throw dbDisabledError();
   const result = await pool.query(text, params);
   return (result.rows[0] as T) ?? null;
 }
@@
 export async function execute(text: string, params?: unknown[]): Promise<number> {
-  if (!pool) throw new Error('Database disabled (DB_MODE=memory)');
+  if (!pool) throw dbDisabledError();
   const result = await pool.query(text, params);
   return result.rowCount ?? 0;
 }
