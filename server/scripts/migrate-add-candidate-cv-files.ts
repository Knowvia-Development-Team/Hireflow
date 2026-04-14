import { pool } from '../lib/db.js';

async function run(): Promise<void> {
  console.log('[DB] Migrating: candidates.cv_url + candidates.cv_filename...');
  await pool.query(`
    ALTER TABLE candidates
      ADD COLUMN IF NOT EXISTS cv_url TEXT,
      ADD COLUMN IF NOT EXISTS cv_filename TEXT
  `);
  console.log('[DB] Migration complete.');
  await pool.end();
}

run().catch((err) => {
  console.error('[DB] Migration failed:', err);
  process.exit(1);
});
