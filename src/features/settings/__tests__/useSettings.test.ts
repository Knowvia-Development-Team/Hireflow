import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { type ReactNode }            from 'react';
import { useOrgSettings, useUpdateSetting, useAuditLog, useGenerateApiKey } from '../hooks/useSettings';
import { INITIAL_AUDIT }  from '@/data';
import { useToastStore }  from '@/shared/stores/toastStore';

function wrap(qc: QueryClient) {
  return function W({ children }: { children: ReactNode }): JSX.Element {
    return React.createElement(QueryClientProvider, { client: qc }, children);
  };
}

describe('useOrgSettings', () => {
  let qc: QueryClient;
  beforeEach(() => { qc = new QueryClient({ defaultOptions: { queries: { retry: false } } }); });

  it('returns default settings', async () => {
    const { result } = renderHook(() => useOrgSettings(), { wrapper: wrap(qc) });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.emailNotifs).toBe(true);
    expect(result.current.data?.aiScoring).toBe(true);
    expect(result.current.data?.slackNotifs).toBe(false);
  });

  it('settings have all expected keys', async () => {
    const { result } = renderHook(() => useOrgSettings(), { wrapper: wrap(qc) });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveProperty('emailNotifs');
    expect(result.current.data).toHaveProperty('slackNotifs');
    expect(result.current.data).toHaveProperty('aiScoring');
    expect(result.current.data).toHaveProperty('autoReject');
    expect(result.current.data).toHaveProperty('theme');
  });
});

describe('useUpdateSetting', () => {
  let qc: QueryClient;
  beforeEach(() => {
    qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: 0 } } });
    useToastStore.setState({ toasts: [] });
  });

  it('optimistically patches the settings cache', async () => {
    const { result } = renderHook(() => useUpdateSetting(), { wrapper: wrap(qc) });
    await act(async () => { result.current.mutate({ slackNotifs: true }); });
    await waitFor(() => result.current.isSuccess);
    expect(useToastStore.getState().toasts.some(t => t.title === 'Settings saved')).toBe(true);
  });

  it('mutation returns updated settings', async () => {
    const { result } = renderHook(() => useUpdateSetting(), { wrapper: wrap(qc) });
    const updated = await result.current.mutateAsync({ autoReject: true });
    expect(updated.autoReject).toBe(true);
  });
});

describe('useAuditLog', () => {
  let qc: QueryClient;
  beforeEach(() => { qc = new QueryClient({ defaultOptions: { queries: { retry: false } } }); });

  it('returns initial audit entries', async () => {
    const { result } = renderHook(() => useAuditLog(), { wrapper: wrap(qc) });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(INITIAL_AUDIT.length);
  });

  it('each entry has actor, action, and time', async () => {
    const { result } = renderHook(() => useAuditLog(), { wrapper: wrap(qc) });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    result.current.data?.forEach(entry => {
      expect(entry).toHaveProperty('actor');
      expect(entry).toHaveProperty('action');
      expect(entry).toHaveProperty('time');
    });
  });
});

describe('useGenerateApiKey', () => {
  let qc: QueryClient;
  beforeEach(() => {
    qc = new QueryClient({ defaultOptions: { mutations: { retry: 0 } } });
    useToastStore.setState({ toasts: [] });
  });

  it('returns a key starting with hf_', async () => {
    const { result } = renderHook(() => useGenerateApiKey(), { wrapper: wrap(qc) });
    const data = await result.current.mutateAsync();
    expect(data.key).toMatch(/^hf_/);
  });

  it('adds a success toast with the key', async () => {
    const { result } = renderHook(() => useGenerateApiKey(), { wrapper: wrap(qc) });
    await result.current.mutateAsync();
    const { toasts } = useToastStore.getState();
    expect(toasts.some(t => t.title === 'API Key Generated')).toBe(true);
  });
});
