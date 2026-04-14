/**
 * Minimal migration: add users.password if missing.
 *
 * Run with:
 *   npx tsx server/scripts/migrate-add-user-password.ts
 */

import { pool } from '../lib/db.js';

const sql = `
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS password TEXT NOT NULL DEFAULT '';
`;

async function run(): Promise<void> {
  console.log('[DB] Migrating: users.password...');
  try {
    await pool.query(sql);
    console.log('[DB] Migration complete.');
  } catch (err) {
    console.error('[DB] Migration failed:', err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

void run();

