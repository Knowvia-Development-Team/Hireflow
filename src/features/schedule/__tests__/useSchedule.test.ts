import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { type ReactNode }            from 'react';
import { useInterviews, useCreateInterview, useUpdateInterviewStatus } from '../hooks/useSchedule';
import { INITIAL_INTERVIEWS } from '@/data';
import { useToastStore }      from '@/shared/stores/toastStore';

function wrap(qc: QueryClient) {
  return function W({ children }: { children: ReactNode }): JSX.Element {
    return React.createElement(QueryClientProvider, { client: qc }, children);
  };
}

describe('useInterviews', () => {
  let qc: QueryClient;
  beforeEach(() => {
    qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    useToastStore.setState({ toasts: [] });
  });

  it('returns all initial interviews', async () => {
    const { result } = renderHook(() => useInterviews(), { wrapper: wrap(qc) });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(INITIAL_INTERVIEWS.length);
  });

  it('each interview has required fields', async () => {
    const { result } = renderHook(() => useInterviews(), { wrapper: wrap(qc) });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const iv = result.current.data?.[0];
    expect(iv).toHaveProperty('id');
    expect(iv).toHaveProperty('candidate');
    expect(iv).toHaveProperty('type');
    expect(iv).toHaveProperty('date');
    expect(iv).toHaveProperty('status');
  });

  it('contains Scheduled, Completed, and No-show statuses', async () => {
    const { result } = renderHook(() => useInterviews(), { wrapper: wrap(qc) });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const statuses = new Set(result.current.data?.map(iv => iv.status));
    expect(statuses.has('Scheduled')).toBe(true);
    expect(statuses.has('Completed')).toBe(true);
    expect(statuses.has('No-show')).toBe(true);
  });
});

describe('useCreateInterview', () => {
  let qc: QueryClient;
  beforeEach(() => {
    qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: 0 } } });
    useToastStore.setState({ toasts: [] });
  });

  it('creates an interview with correct fields', async () => {
    const { result } = renderHook(() => useCreateInterview(), { wrapper: wrap(qc) });
    const iv = await result.current.mutateAsync({
      candidate: 'Lena Müller', type: 'Final',
      date: '2026-04-01', time: '10:00',
      duration: 60, interviewers: 'Tino Dube', notes: '',
    });
    expect(iv.candidate).toBe('Lena Müller');
    expect(iv.type).toBe('Final');
    expect(iv.status).toBe('Scheduled');
    expect(iv.videoLink).toMatch(/meet\.google\.com/);
  });

  it('generates a unique numeric id', async () => {
    const { result } = renderHook(() => useCreateInterview(), { wrapper: wrap(qc) });
    const iv = await result.current.mutateAsync({
      candidate: 'Test User', type: 'Screening',
      date: '2026-04-01', time: '14:00',
      duration: 30, interviewers: 'Tino', notes: '',
    });
    expect(typeof iv.id).toBe('number');
  });

  it('adds a success toast on create', async () => {
    const { result } = renderHook(() => useCreateInterview(), { wrapper: wrap(qc) });
    await result.current.mutateAsync({
      candidate: 'Ahmed Hassan', type: 'Technical',
      date: '2026-04-02', time: '09:00',
      duration: 90, interviewers: 'James', notes: '',
    });
    const { toasts } = useToastStore.getState();
    expect(toasts.some(t => t.color === 'green')).toBe(true);
  });

  it('rejects invalid form data (bad date format)', async () => {
    const { result } = renderHook(() => useCreateInterview(), { wrapper: wrap(qc) });
    await expect(result.current.mutateAsync({
      candidate: 'X', type: 'Screening',
      date: 'not-a-date', time: '10:00',
      duration: 30, interviewers: 'Y', notes: '',
    })).rejects.toThrow();
  });
});

describe('useUpdateInterviewStatus', () => {
  let qc: QueryClient;
  beforeEach(() => {
    qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: 0 } } });
    useToastStore.setState({ toasts: [] });
    qc.setQueryData(['interviews', 'list'], INITIAL_INTERVIEWS);
  });

  it('updates status and shows success toast', async () => {
    const { result } = renderHook(() => useUpdateInterviewStatus(), { wrapper: wrap(qc) });
    await result.current.mutateAsync({ id: 1, status: 'Completed' });
    const { toasts } = useToastStore.getState();
    expect(toasts.some(t => t.title === 'Status updated')).toBe(true);
  });

  it('optimistically updates cache', async () => {
    const { result } = renderHook(() => useUpdateInterviewStatus(), { wrapper: wrap(qc) });
    await act(async () => {
      result.current.mutate({ id: 1, status: 'Cancelled' });
    });
    const cached = qc.getQueryData<typeof INITIAL_INTERVIEWS>(['interviews', 'list']);
    const updated = cached?.find(iv => iv.id === 1);
    expect(updated?.status).toBe('Cancelled');
  });
});
