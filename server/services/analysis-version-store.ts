import { execute } from '../lib/db.js';
import { isMemoryDb } from '../lib/runtime.js';

export interface AnalysisVersionRecord {
  applicationId: string;
  jobId?: string;
  analysisType: 'extract' | 'match' | 'sentiment' | 'skill-gap';
  version: string;
  inputHash: string;
  result: unknown;
  piiRedactions?: number;
}

function normaliseJobId(jobId?: string): string {
  return (jobId ?? '').trim();
}

export async function storeAnalysisVersion(rec: AnalysisVersionRecord): Promise<void> {
  if (isMemoryDb) return;
  await execute(
    `INSERT INTO ai_analysis_versions
      (application_id, job_id, analysis_type, version, input_hash, result, pii_redactions, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
    [
      rec.applicationId,
      normaliseJobId(rec.jobId),
      rec.analysisType,
      rec.version,
      rec.inputHash,
      rec.result,
      rec.piiRedactions ?? 0,
    ],
  );
}
