/**
 * Cleanup: merge duplicate candidates by email (keep newest)
 * Run with: npm.cmd --prefix server exec -- tsx server/scripts/cleanup-duplicate-candidates.ts
 */
import { pool } from '../lib/db.js';

type CandidateRow = {
  id: string;
  email: string;
  name: string | null;
  role: string | null;
  stage: string | null;
  stage_key: string | null;
  source: string | null;
  score: number | null;
  cv_text: string | null;
  applied: string | null;
  applied_at: string | null;
  screening_at: string | null;
  interview_at: string | null;
  final_at: string | null;
  offer_at: string | null;
  hired_at: string | null;
  rejected_at: string | null;
  created_at: string | null;
};

const preferSource = (primary: string | null, candidate: string | null): string | null => {
  if (!primary) return candidate;
  if (!candidate) return primary;
  if (primary.toLowerCase() === 'cv upload' && candidate.toLowerCase() !== 'cv upload') return candidate;
  return primary;
};

async function run() {
  console.log('[DB] Cleaning duplicate candidates by email...');
  try {
    const dupEmails = await pool.query<{ email: string }>(`
      SELECT LOWER(email) as email
      FROM candidates
      GROUP BY LOWER(email)
      HAVING COUNT(*) > 1
    `);

    let merged = 0;
    for (const row of dupEmails.rows) {
      const email = row.email;
      const res = await pool.query<CandidateRow>(
        `SELECT * FROM candidates WHERE LOWER(email) = $1 ORDER BY created_at DESC NULLS LAST`,
        [email]
      );
      const candidates = res.rows;
      if (candidates.length < 2) continue;

      const primary = candidates[0]!;
      const duplicates = candidates.slice(1);

      let mergedScore = primary.score ?? 0;
      let mergedCv = primary.cv_text;
      let mergedSource = primary.source;

      for (const dup of duplicates) {
        if (!mergedCv && dup.cv_text) mergedCv = dup.cv_text;
        mergedScore = Math.max(mergedScore, dup.score ?? 0);
        mergedSource = preferSource(mergedSource, dup.source);
      }

      await pool.query(
        `UPDATE candidates
         SET score = $1,
             cv_text = $2,
             source = $3,
             updated_at = NOW()
         WHERE id = $4`,
        [mergedScore, mergedCv, mergedSource, primary.id]
      );

      await pool.query(
        `DELETE FROM candidates WHERE id = ANY($1::uuid[])`,
        [duplicates.map(d => d.id)]
      );

      merged += duplicates.length;
    }

    console.log(`[DB] Cleanup complete. Removed ${merged} duplicate rows.`);
  } catch (err) {
    console.error('[DB] Cleanup failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

run();
