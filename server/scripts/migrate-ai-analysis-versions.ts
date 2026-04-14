/**
 * Minimal migration: create ai_analysis_versions table if missing.
 *
 * Run with:
 *   npx tsx server/scripts/migrate-ai-analysis-versions.ts
 */

import { pool } from '../lib/db.js';

const sql = `
CREATE TABLE IF NOT EXISTS ai_analysis_versions (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id TEXT        NOT NULL,
  job_id         TEXT        DEFAULT '',
  analysis_type  VARCHAR(40) NOT NULL,
  version        VARCHAR(40) NOT NULL,
  input_hash     TEXT        NOT NULL,
  result         JSONB       NOT NULL,
  pii_redactions INTEGER     DEFAULT 0,
  created_at     TIMESTAMP   DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_analysis_app ON ai_analysis_versions(application_id);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_type ON ai_analysis_versions(analysis_type);
`;

async function run(): Promise<void> {
  console.log('[DB] Migrating: ai_analysis_versions...');
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

