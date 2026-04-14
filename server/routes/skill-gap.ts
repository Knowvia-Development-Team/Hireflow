import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import type { ApiError } from '../types.js';
import { analyseSkillGap, stableTextHash, type SkillGapResult } from '../services/skill-gap.js';
import { getCachedSkillGap, upsertCachedSkillGap } from '../services/skill-gap-store.js';
import { storeAnalysisVersion } from '../services/analysis-version-store.js';

const router = Router();

const SkillGapOptionsSchema = z.object({
  requiredWeight: z.number().positive().max(10).optional(),
  niceWeight: z.number().positive().max(10).optional(),
}).strict();

const SkillGapRequestSchema = z.object({
  jobText: z.string().min(1),
  cvText: z.string().min(1),
  options: SkillGapOptionsSchema.optional(),
  // Optional persistence keys (UI can pass these without changing required contract)
  applicationId: z.string().min(1).optional(),
  jobId: z.string().min(1).optional(),
}).passthrough();

const SkillGapResultSchema: z.ZodType<SkillGapResult> = z.object({
  fitScore: z.number().int().min(0).max(100),
  confidence: z.number().int().min(0).max(100),
  needsReview: z.boolean(),
  explanations: z.array(z.string().min(1)).max(8),
  version: z.string().min(1),
  strengths: z.array(z.object({
    skill: z.string().min(1),
    evidence: z.array(z.string().min(1)).max(6),
  })).max(60),
  missing: z.array(z.object({
    skill: z.string().min(1),
    reason: z.string().min(1),
  })).max(60),
  summary: z.array(z.string().min(1)).min(3).max(6),
}).strict();

router.post('/', async (
  req: Request<Record<string, never>, SkillGapResult | ApiError, unknown>,
  res: Response<SkillGapResult | ApiError>,
): Promise<void> => {
  const parsed = SkillGapRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues.map(i => i.message).join('; ') });
    return;
  }

  const { jobText, cvText, options, applicationId, jobId } = parsed.data;

  const jobTextHash = stableTextHash(jobText);
  const cvTextHash = stableTextHash(cvText);
  const cleanOptions = options
    ? {
        ...(options.requiredWeight !== undefined ? { requiredWeight: options.requiredWeight } : {}),
        ...(options.niceWeight !== undefined ? { niceWeight: options.niceWeight } : {}),
      }
    : undefined;

  if (applicationId) {
    try {
      const cached = await getCachedSkillGap({
        applicationId,
        ...(jobId ? { jobId } : {}),
        jobTextHash,
        cvTextHash,
      });
      if (cached) {
        res.json(cached);
        return;
      }
    } catch (e) {
      console.warn('[skill-gap] cache read failed:', e instanceof Error ? e.message : String(e));
    }
  }

  const result = analyseSkillGap(jobText, cvText, cleanOptions);
  const out = SkillGapResultSchema.safeParse(result);
  if (!out.success) {
    res.status(500).json({ error: 'Internal error: invalid analysis result shape' });
    return;
  }

  if (applicationId) {
    try {
      await upsertCachedSkillGap({
        applicationId,
        ...(jobId ? { jobId } : {}),
        jobTextHash,
        cvTextHash,
      }, out.data);
    } catch (e) {
      console.warn('[skill-gap] cache write failed:', e instanceof Error ? e.message : String(e));
    }
  }

  if (applicationId) {
    try {
      await storeAnalysisVersion({
        applicationId,
        jobId,
        analysisType: 'skill-gap',
        version: out.data.version,
        inputHash: stableTextHash(`${jobTextHash}:${cvTextHash}`),
        result: out.data,
        piiRedactions: 0,
      });
    } catch (e) {
      console.warn('[skill-gap] version store failed:', e instanceof Error ? e.message : String(e));
    }
  }

  res.json(out.data);
});

export default router;
