/**
 * Debug: find candidate by email
 * Run: npm.cmd --prefix server exec -- tsx server/scripts/debug-find-candidate.ts someone@example.com
 */

import { pool } from '../lib/db.js';

async function run(): Promise<void> {
  const email = process.argv[2];
  if (!email) {
    console.error('Usage: tsx server/scripts/debug-find-candidate.ts <email>');
    process.exit(1);
  }
  try {
    const result = await pool.query(
      'SELECT id, name, email, role, stage, source, score, cv_url, cv_filename, created_at FROM candidates WHERE LOWER(email) = LOWER($1) ORDER BY created_at DESC',
      [email]
    );
    console.log(`[DB] Found ${result.rowCount ?? 0} candidate(s) for ${email}`);
    console.log(result.rows);
  } catch (err) {
    console.error('[DB] Query failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

run();
