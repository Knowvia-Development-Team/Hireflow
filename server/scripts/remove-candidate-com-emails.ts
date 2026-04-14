/**
 * Cleanup: remove candidates with email ending in @candidate.com
 * Run with: npm.cmd --prefix server exec -- tsx server/scripts/remove-candidate-com-emails.ts
 */
import { pool } from '../lib/db.js';

async function run() {
  console.log('[DB] Removing candidates with @candidate.com emails...');
  try {
    const result = await pool.query(`
      DELETE FROM candidates
      WHERE LOWER(email) LIKE '%@candidate.com'
    `);
    console.log(`[DB] Removed ${result.rowCount ?? 0} candidates.`);
  } catch (err) {
    console.error('[DB] Cleanup failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

run();
