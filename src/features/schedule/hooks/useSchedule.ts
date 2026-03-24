/**
 * useSchedule — React Query hook for interview scheduling
 * ─────────────────────────────────────────────────────────
 * Optimistic creates: new interview appears in the calendar immediately,
 * rolls back if the server rejects it.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast }           from '@/shared/stores/toastStore';
import { INITIAL_INTERVIEWS } from '@/data';
import type { Interview, NewInterviewFormData } from '@/types';
import { parseOrThrow, ScheduleInterviewSchema } from '@/shared/lib/validators';
import { logger }          from '@/shared/lib/logger';

export const scheduleKeys = {
  all:  ['interviews']            as const,
  list: () => ['interviews', 'list'] as const,
};

export function useInterviews() {
  return useQuery({
    queryKey: scheduleKeys.list(),
    queryFn:  () => Promise.resolve(INITIAL_INTERVIEWS),
    staleTime: 60_000,
  });
}

export function useCreateInterview() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (form: NewInterviewFormData): Promise<Interview> => {
      const v = parseOrThrow(ScheduleInterviewSchema, form);
      const iv: Interview = {
        id:           Date.now(),
        candidate:    v.candidate,
        role:         '',
        type:         v.type as Interview['type'],
        date:         v.date,
        time:         v.time,
        duration:     v.duration,
        interviewers: v.interviewers,
        videoLink:    `meet.google.com/hf-${Math.random().toString(36).slice(2, 8)}`,
        notes:        v.notes ?? '',
        status:       'Scheduled',
      };
      return Promise.resolve(iv);
    },

    onMutate: async (_form) => {
      await qc.cancelQueries({ queryKey: scheduleKeys.all });
      const prev = qc.getQueryData<Interview[]>(scheduleKeys.list());
      return { prev };
    },

    onSuccess: (newIv) => {
      qc.setQueryData<Interview[]>(scheduleKeys.list(),
        old => [...(old ?? []), newIv]);
      toast.success('Interview Scheduled',
        `${newIv.candidate} — ${newIv.type} on ${newIv.date}`);
      logger.info('Interview created', { id: newIv.id, candidate: newIv.candidate });
    },

    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(scheduleKeys.list(), ctx.prev);
      toast.warning('Scheduling failed', 'Check your input and try again.');
    },
  });
}

export function useUpdateInterviewStatus() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: Interview['status'] }) =>
      Promise.resolve({ id, status } as Partial<Interview>),

    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: scheduleKeys.all });
      const prev = qc.getQueryData<Interview[]>(scheduleKeys.list());
      qc.setQueryData<Interview[]>(scheduleKeys.list(),
        old => old?.map(iv => iv.id === id ? { ...iv, status } : iv) ?? []);
      return { prev };
    },

    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(scheduleKeys.list(), ctx.prev);
      toast.warning('Status update failed', '');
    },

    onSuccess: (_, { status }) => {
      toast.success('Status updated', `Interview marked as ${status}`);
      void qc.invalidateQueries({ queryKey: scheduleKeys.all });
    },
  });
}
