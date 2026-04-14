/**
 * Create or update an admin user.
 *
 * Usage:
 *   npm.cmd --prefix server exec -- tsx server/scripts/create-admin-user.ts Hireflow@recruit.zw hire123
 */

import bcrypt from 'bcryptjs';
import { pool } from '../lib/db.js';

async function run(): Promise<void> {
  const email = process.argv[2] ?? 'Hireflow@recruit.zw';
  const password = process.argv[3] ?? 'hire123';
  const name = 'Hireflow Admin';
  const role = 'admin';

  const hash = await bcrypt.hash(password, 10);

  await pool.query(
    `
    INSERT INTO users (name, email, password, role)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (email)
    DO UPDATE SET password = EXCLUDED.password, role = EXCLUDED.role, name = EXCLUDED.name
    `,
    [name, email, hash, role],
  );

  console.log(`[auth] Admin user ready: ${email}`);
  await pool.end();
}

void run();
