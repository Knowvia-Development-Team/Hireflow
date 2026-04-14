/**
 * Set a user's password hash.
 *
 * Usage:
 *   npx tsx server/scripts/set-user-password.ts mika.sato@northgrid.io Password123!
 */

import bcrypt from 'bcryptjs';
import { pool } from '../lib/db.js';

async function run(): Promise<void> {
  const email = process.argv[2] ?? 'mika.sato@northgrid.io';
  const password = process.argv[3] ?? 'Password123!';

  const hash = await bcrypt.hash(password, 10);
  const result = await pool.query(
    'UPDATE users SET password = $1 WHERE email = $2',
    [hash, email],
  );

  if (result.rowCount === 0) {
    console.error(`[auth] No user found for ${email}`);
    process.exitCode = 1;
  } else {
    console.log(`[auth] Password updated for ${email}`);
  }

  await pool.end();
}

void run();

