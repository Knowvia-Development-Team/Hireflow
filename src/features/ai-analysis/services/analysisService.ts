import { apiClient }  from '@/shared/lib/api/client';
import { logger }     from '@/shared/lib/logger';
import type { ExtractResult, MatchResult, SentimentResult } from '@/types';

export interface AnalysisApiSuccess<T> { success: true;  data: T; }
export type AnalysisApiResponse<T>    = AnalysisApiSuccess<T> | { success: false; error: string };

const BASE = '/api/analyse';

async function analyseRequest<T>(
  endpoint: string,
  body: Record<string, string>,
  signal?: AbortSignal,
): Promise<T> {
  const start = performance.now();
  const { data } = await apiClient.post<AnalysisApiSuccess<T>>(
    `${BASE}/${endpoint}`,
    body,
    signal !== undefined ? { signal } : {},
  );
  logger.perf(`AI analysis: ${endpoint}`, performance.now() - start);
  return data.data;
}

export const analysisService = {
  extract:   (text: string,    signal?: AbortSignal) => analyseRequest<ExtractResult>('extract',   { text }, signal),
  match:     (cvText: string, jobText: string, signal?: AbortSignal) => analyseRequest<MatchResult>('match', { cvText, jobText }, signal),
  sentiment: (text: string,    signal?: AbortSignal) => analyseRequest<SentimentResult>('sentiment', { text }, signal),
};
