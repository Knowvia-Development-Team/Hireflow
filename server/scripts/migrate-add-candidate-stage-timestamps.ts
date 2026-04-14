/**
 * Migration: add stage timestamp columns to candidates
 * Run with: npm.cmd --prefix server exec -- tsx server/scripts/migrate-add-candidate-stage-timestamps.ts
 */
import { pool } from '../lib/db.js';

async function run() {
  console.log('[DB] Migrating: candidates stage timestamps...');
  try {
    await pool.query(`
      ALTER TABLE candidates
        ADD COLUMN IF NOT EXISTS applied_at TIMESTAMP,
        ADD COLUMN IF NOT EXISTS screening_at TIMESTAMP,
        ADD COLUMN IF NOT EXISTS interview_at TIMESTAMP,
        ADD COLUMN IF NOT EXISTS final_at TIMESTAMP,
        ADD COLUMN IF NOT EXISTS offer_at TIMESTAMP,
        ADD COLUMN IF NOT EXISTS hired_at TIMESTAMP,
        ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP;
    `);
    console.log('[DB] Migration complete.');
  } catch (err) {
    console.error('[DB] Migration failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

run();
