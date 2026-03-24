/**
 * Candidate Service
 * ──────────────────
 * All API calls for candidates live here.
 * Components never call axios/fetch directly — always through a service.
 */

import { post } from '@/shared/lib/api/client';
import type { Candidate, NewCandidateFormData } from '@/types';

export interface CandidatesResponse {
  data:  Candidate[];
  total: number;
  page:  number;
}

export interface CandidateFilters {
  stage?:  string;
  search?: string;
  page?:   number;
  limit?:  number;
}

// In production these would hit real endpoints.
// For now they simulate server round-trips with type safety.

export const candidateService = {
  list: (filters: CandidateFilters): Promise<CandidatesResponse> =>
    post('/candidates/list', filters),

  create: (data: NewCandidateFormData): Promise<Candidate> =>
    post('/candidates', data),

  advance: (id: string, nextStage: string): Promise<Candidate> =>
    post(`/candidates/${id}/advance`, { stage: nextStage }),

  reject: (id: string): Promise<Candidate> =>
    post(`/candidates/${id}/reject`, {}),
};
