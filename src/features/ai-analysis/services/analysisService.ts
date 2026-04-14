import { apiClient }  from '@/shared/lib/api/client';
import { logger }     from '@/shared/lib/logger';
import type { ExtractResult, MatchResult, SentimentResult, SkillGapResult } from '@/types';

export interface AnalysisApiSuccess<T> { success: true;  data: T; }
export type AnalysisApiResponse<T>    = AnalysisApiSuccess<T> | { success: false; error: string };

const BASE = '/api/analyse';

async function analyseRequest<T>(
  endpoint: string,
  body: unknown,
  signal?: AbortSignal,
): Promise<T> {
  const start = performance.now();
  const res = await apiClient.post<AnalysisApiSuccess<T>>(
    `${BASE}/${endpoint}`,
    body,
    signal !== undefined ? { signal } : {},
  );
  logger.perf(`AI analysis: ${endpoint}`, performance.now() - start);
  return res.data;
}

export const analysisService = {
  extract:   (text: string,    signal?: AbortSignal) => analyseRequest<ExtractResult>('extract',   { text }, signal),
  match:     (cvText: string, jobText: string, signal?: AbortSignal) => analyseRequest<MatchResult>('match', { cvText, jobText }, signal),
  sentiment: (text: string,    signal?: AbortSignal) => analyseRequest<SentimentResult>('sentiment', { text }, signal),
  skillGap:  async (
    jobText: string,
    cvText: string,
    options?: { requiredWeight?: number; niceWeight?: number },
    ids?: { applicationId?: string; jobId?: string },
    signal?: AbortSignal,
  ): Promise<SkillGapResult> => {
    const start = performance.now();
    const res = await apiClient.post<SkillGapResult>(
      `${BASE}/skill-gap`,
      { jobText, cvText, options, ...(ids ?? {}) },
      signal !== undefined ? { signal } : {},
    );
    logger.perf('AI analysis: skill-gap', performance.now() - start);
    return res;
  },
};
