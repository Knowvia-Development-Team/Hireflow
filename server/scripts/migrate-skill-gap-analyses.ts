/**
 * Minimal migration: create the skill_gap_analyses cache table if missing.
 *
 * Run with: npm.cmd --prefix server run dev -- ??? (or)
 *   npm.cmd --prefix server run db:push   (fresh schema includes it)
 *   npx tsx server/scripts/migrate-skill-gap-analyses.ts
 */

import { pool } from '../lib/db.js';

const sql = `
CREATE TABLE IF NOT EXISTS skill_gap_analyses (
  application_id TEXT      NOT NULL,
  job_id         TEXT      NOT NULL DEFAULT '',
  job_text_hash  TEXT      NOT NULL,
  cv_text_hash   TEXT      NOT NULL,
  result         JSONB     NOT NULL,
  created_at     TIMESTAMP DEFAULT NOW(),
  updated_at     TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (application_id, job_id)
);

CREATE INDEX IF NOT EXISTS idx_skill_gap_updated ON skill_gap_analyses(updated_at);
`;

async function run(): Promise<void> {
  console.log('[DB] Migrating: skill_gap_analyses...');
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

