import { queryOne, execute } from '../lib/db.js';
import { isMemoryDb } from '../lib/runtime.js';
import type { SkillGapResult } from './skill-gap.js';

export interface SkillGapCacheKey {
  applicationId: string;
  jobId?: string;
  jobTextHash: string;
  cvTextHash: string;
}

interface SkillGapRow {
  result: SkillGapResult;
  job_text_hash: string;
  cv_text_hash: string;
}

const TABLE = 'skill_gap_analyses';

function normaliseJobId(jobId?: string): string {
  return (jobId ?? '').trim();
}

export async function getCachedSkillGap(key: SkillGapCacheKey): Promise<SkillGapResult | null> {
  if (isMemoryDb) return null;
  const jobId = normaliseJobId(key.jobId);
  const row = await queryOne<SkillGapRow>(
    `SELECT result, job_text_hash, cv_text_hash
       FROM ${TABLE}
      WHERE application_id = $1 AND job_id = $2
      LIMIT 1`,
    [key.applicationId, jobId],
  );
  if (!row) return null;
  if (row.job_text_hash !== key.jobTextHash) return null;
  if (row.cv_text_hash !== key.cvTextHash) return null;
  return row.result;
}

export async function upsertCachedSkillGap(
  key: SkillGapCacheKey,
  result: SkillGapResult,
): Promise<void> {
  if (isMemoryDb) return;
  const jobId = normaliseJobId(key.jobId);
  await execute(
    `INSERT INTO ${TABLE} (application_id, job_id, job_text_hash, cv_text_hash, result, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
     ON CONFLICT (application_id, job_id)
     DO UPDATE SET
       job_text_hash = EXCLUDED.job_text_hash,
       cv_text_hash  = EXCLUDED.cv_text_hash,
       result        = EXCLUDED.result,
       updated_at    = NOW()`,
    [key.applicationId, jobId, key.jobTextHash, key.cvTextHash, result],
  );
}
