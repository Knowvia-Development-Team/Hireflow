import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast }           from '@/shared/stores/toastStore';
import { INITIAL_AUDIT }   from '@/data';
import type { OrgSettings } from '../services/settingsService';

export const settingsKeys = {
  all:      ['settings']            as const,
  settings: () => ['settings', 'org'] as const,
  audit:    () => ['settings', 'audit'] as const,
  team:     () => ['settings', 'team'] as const,
};

const DEFAULT_SETTINGS: OrgSettings = {
  theme:       'light',
  emailNotifs:  true,
  slackNotifs:  false,
  aiScoring:    true,
  autoReject:   false,
};

export function useOrgSettings() {
  return useQuery({
    queryKey: settingsKeys.settings(),
    queryFn:  () => Promise.resolve(DEFAULT_SETTINGS),
    staleTime: Infinity, // settings rarely change mid-session
  });
}

export function useUpdateSetting() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (patch: Partial<OrgSettings>) =>
      Promise.resolve({ ...DEFAULT_SETTINGS, ...patch }),

    onMutate: async (patch) => {
      await qc.cancelQueries({ queryKey: settingsKeys.all });
      const prev = qc.getQueryData<OrgSettings>(settingsKeys.settings());
      qc.setQueryData<OrgSettings>(settingsKeys.settings(),
        old => ({ ...(old ?? DEFAULT_SETTINGS), ...patch }));
      return { prev };
    },

    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(settingsKeys.settings(), ctx.prev);
      toast.warning('Settings update failed', 'Your change was reverted.');
    },

    onSuccess: () => {
      toast.success('Settings saved', '');
    },
  });
}

export function useAuditLog() {
  return useQuery({
    queryKey: settingsKeys.audit(),
    queryFn:  () => Promise.resolve(INITIAL_AUDIT),
    staleTime: 60_000,
  });
}

export function useGenerateApiKey() {
  return useMutation({
    mutationFn: () => Promise.resolve({
      key:  'hf_' + Math.random().toString(36).slice(2, 18),
      name: 'Generated key',
    }),
    onSuccess: (data) => {
      toast.success('API Key Generated', data.key);
    },
    onError: () => {
      toast.warning('Key generation failed', '');
    },
  });
}
