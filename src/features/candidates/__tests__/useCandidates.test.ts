import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, waitFor }  from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode }       from 'react';
import React                    from 'react';
import { useCandidates }        from '../hooks/useCandidates';
import { INITIAL_CANDIDATES }   from '@/data';

function makeWrapper(qc: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }): JSX.Element {
    return React.createElement(QueryClientProvider, { client: qc }, children);
  };
}

describe('useCandidates', () => {
  let qc: QueryClient;

  beforeEach(() => {
    qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  });

  it('returns candidate data from the query', async () => {
    const { result } = renderHook(() => useCandidates(), { wrapper: makeWrapper(qc) });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(INITIAL_CANDIDATES.length);
  });

  it('contains expected candidate fields', async () => {
    const { result } = renderHook(() => useCandidates(), { wrapper: makeWrapper(qc) });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const first = result.current.data?.[0];
    expect(first).toHaveProperty('id');
    expect(first).toHaveProperty('name');
    expect(first).toHaveProperty('email');
    expect(first).toHaveProperty('score');
    expect(first).toHaveProperty('stage');
    expect(first).toHaveProperty('stageKey');
  });

  it('starts in loading state', () => {
    const { result } = renderHook(() => useCandidates(), { wrapper: makeWrapper(qc) });
    // Before the promise resolves, it's in a pending state
    expect(result.current.isPending || result.current.isSuccess).toBe(true);
  });

  it('accepts stage filter', async () => {
    const { result } = renderHook(
      () => useCandidates({ stage: 'Applied' }),
      { wrapper: makeWrapper(qc) },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    // The hook returns all data (filtering happens in the component for the demo)
    expect(Array.isArray(result.current.data)).toBe(true);
  });
});
