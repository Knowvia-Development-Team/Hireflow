/**
 * useCandidates — React Query hook
 * ─────────────────────────────────
 * Wraps candidateService with caching, background refetch,
 * and optimistic updates for stage mutations.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { candidateService, type CandidateFilters } from '../services/candidateService';
import { toast } from '@/shared/stores/toastStore';
import type { Candidate } from '@/types';
import { INITIAL_CANDIDATES, STAGE_PROGRESSION } from '@/data';

// Query key factory — ensures consistent cache keys
export const candidateKeys = {
  all:     ['candidates']              as const,
  list:    (f: CandidateFilters) => ['candidates', 'list', f] as const,
  detail:  (id: string)          => ['candidates', id]        as const,
};

/** Fetch all candidates with optional filters */
export function useCandidates(filters: CandidateFilters = {}) {
  return useQuery({
    queryKey: candidateKeys.list(filters),
    // In a real app: queryFn: () => candidateService.list(filters)
    // Using local data for the demo build:
    queryFn: () => Promise.resolve({ data: INITIAL_CANDIDATES, total: INITIAL_CANDIDATES.length, page: 1 }),
    placeholderData: (prev) => prev, // keep previous data while re-fetching
    select: (res) => res.data,
  });
}

/** Advance a candidate to the next pipeline stage (optimistic update) */
export function useAdvanceCandidate() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, nextStage }: { id: string; nextStage: string }) =>
      candidateService.advance(id, nextStage),

    // Optimistic update: update cache immediately, roll back on error
    onMutate: async ({ id, nextStage }) => {
      await qc.cancelQueries({ queryKey: candidateKeys.all });
      const previous = qc.getQueriesData<{ data: Candidate[] }>({ queryKey: candidateKeys.all });

      qc.setQueriesData<{ data: Candidate[] }>(
        { queryKey: candidateKeys.all },
        (old) => ({
          ...old!,
          data: old!.data.map(c =>
            c.id === id
              ? { ...c, stage: nextStage, stageKey: nextStage.split(' ')[0] as Candidate['stageKey'] }
              : c,
          ),
        }),
      );

      return { previous };
    },

    onError: (_err, _vars, ctx) => {
      // Roll back optimistic update
      if (ctx?.previous) {
        ctx.previous.forEach(([key, data]) => qc.setQueryData(key, data));
      }
      toast.warning('Stage update failed', 'Changes have been reverted.');
    },

    onSuccess: (_data, { nextStage }) => {
      toast.success('Stage Advanced', `Moved to ${nextStage}`);
      void qc.invalidateQueries({ queryKey: candidateKeys.all });
    },
  });
}

/** Reject a candidate */
export function useRejectCandidate() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => candidateService.reject(id),

    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: candidateKeys.all });
      const previous = qc.getQueriesData<{ data: Candidate[] }>({ queryKey: candidateKeys.all });

      qc.setQueriesData<{ data: Candidate[] }>(
        { queryKey: candidateKeys.all },
        (old) => ({
          ...old!,
          data: old!.data.map(c =>
            c.id === id ? { ...c, stage: 'Rejected', stageKey: 'Rejected' as const } : c,
          ),
        }),
      );
      return { previous };
    },

    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) {
        ctx.previous.forEach(([key, data]) => qc.setQueryData(key, data));
      }
      toast.warning('Rejection failed', 'Changes have been reverted.');
    },

    onSuccess: () => {
      toast.info('Candidate Rejected', '');
      void qc.invalidateQueries({ queryKey: candidateKeys.all });
    },
  });
}

// Re-export for convenience
export { STAGE_PROGRESSION };
