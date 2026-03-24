import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, waitFor }  from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { type ReactNode }            from 'react';
import { useJobs, useCreateJob }            from '../hooks/useJobs';
import { INITIAL_JOBS }                     from '@/data';

function makeWrapper(qc: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }): JSX.Element {
    return React.createElement(QueryClientProvider, { client: qc }, children);
  };
}

describe('useJobs', () => {
  let qc: QueryClient;
  beforeEach(() => {
    qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  });

  it('returns all initial jobs', async () => {
    const { result } = renderHook(() => useJobs(), { wrapper: makeWrapper(qc) });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(INITIAL_JOBS.length);
  });

  it('each job has required fields', async () => {
    const { result } = renderHook(() => useJobs(), { wrapper: makeWrapper(qc) });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const job = result.current.data?.[0];
    expect(job).toHaveProperty('id');
    expect(job).toHaveProperty('title');
    expect(job).toHaveProperty('status');
    expect(job).toHaveProperty('applicants');
    expect(job).toHaveProperty('dept');
  });

  it('returns Open, Draft, and Paused jobs', async () => {
    const { result } = renderHook(() => useJobs(), { wrapper: makeWrapper(qc) });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const statuses = new Set(result.current.data?.map(j => j.status));
    expect(statuses.has('Open')).toBe(true);
    expect(statuses.has('Draft')).toBe(true);
    expect(statuses.has('Paused')).toBe(true);
  });
});

describe('useCreateJob', () => {
  let qc: QueryClient;
  beforeEach(() => {
    qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: 0 } } });
  });

  it('mutation is initially idle', () => {
    const { result } = renderHook(() => useCreateJob(), { wrapper: makeWrapper(qc) });
    expect(result.current.isPending).toBe(false);
    expect(result.current.isSuccess).toBe(false);
  });

  it('creates a job with correct fields', async () => {
    const { result } = renderHook(() => useCreateJob(), { wrapper: makeWrapper(qc) });
    await result.current.mutateAsync({
      title: 'Test Role', dept: 'Engineering',
      type: 'Full-time', location: 'Remote',
      desc: 'A test job', skills: 'TypeScript',
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const job = result.current.data;
    expect(job?.title).toBe('Test Role');
    expect(job?.dept).toBe('Engineering');
    expect(job?.status).toBe('Open');
    expect(job?.applicants).toBe(0);
  });

  it('generates a unique job ID', async () => {
    const { result } = renderHook(() => useCreateJob(), { wrapper: makeWrapper(qc) });
    const job = await result.current.mutateAsync({
      title: 'Job A', dept: 'Design', type: 'Full-time', location: 'Remote', desc: '', skills: '',
    });
    expect(job.id).toMatch(/^job-/);
  });
});
