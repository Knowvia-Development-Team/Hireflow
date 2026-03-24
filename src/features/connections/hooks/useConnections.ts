import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast }          from '@/shared/stores/toastStore';
import { INITIAL_EMAILS } from '@/data';
import { logger }         from '@/shared/lib/logger';
import type { Email }     from '@/types';

export const emailKeys = {
  all:  ['emails']            as const,
  list: () => ['emails', 'list'] as const,
};

export function useEmails() {
  return useQuery({
    queryKey: emailKeys.list(),
    queryFn:  () => Promise.resolve(INITIAL_EMAILS),
    staleTime: 30_000,
  });
}

export function useSendEmail() {
  return useMutation({
    mutationFn: ({ to, body }: { to: string; body: string; threadId: string }) => {
      if (!body.trim()) throw new Error('Email body cannot be empty');
      logger.info('Email sent', { to });
      return Promise.resolve({ messageId: 'msg-' + Date.now(), delivered: true });
    },
    onSuccess: (_, { to }) => { toast.success('Email Sent', `Delivered to ${to}`); },
    onError:   (e) => { toast.warning('Send failed', e instanceof Error ? e.message : 'Unknown error'); },
  });
}

export function useMarkEmailRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => Promise.resolve(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: emailKeys.all });
      const prev = qc.getQueryData<Email[]>(emailKeys.list());
      qc.setQueryData<Email[]>(emailKeys.list(),
        old => old?.map(e => e.id === id ? { ...e, unread: false } : e) ?? []);
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(emailKeys.list(), ctx.prev);
    },
  });
}

export function useUnreadCount(): number {
  const { data: emails } = useEmails();
  return emails?.filter(e => e.unread).length ?? 0;
}
