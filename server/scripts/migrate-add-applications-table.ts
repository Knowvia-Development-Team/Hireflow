/**
 * Migration: add applications table if missing
 * Run with: npm.cmd --prefix server exec -- tsx server/scripts/migrate-add-applications-table.ts
 */

import { pool } from '../lib/db.js';

const sql = `
CREATE TABLE IF NOT EXISTS applications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id          UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  full_name       TEXT NOT NULL,
  email           TEXT NOT NULL,
  phone           TEXT,
  linkedin_url    TEXT,
  cover_letter    TEXT,
  cv_url          TEXT,
  cv_filename     TEXT,
  status          TEXT DEFAULT 'new',
  notes           TEXT,
  extracted_data  JSONB,
  match_score     INTEGER,
  match_result    JSONB,
  sentiment_result JSONB,
  ai_analyzed_at  TIMESTAMPTZ,
  rejected_at     TIMESTAMPTZ,
  hired_at        TIMESTAMPTZ,
  applied_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_id, email)
);

CREATE INDEX IF NOT EXISTS idx_applications_job_id ON applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
`;

async function run(): Promise<void> {
  console.log('[DB] Migrating: applications table...');
  try {
    await pool.query(sql);
    console.log('[DB] Migration complete.');
  } catch (err) {
    console.error('[DB] Migration failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

run();
