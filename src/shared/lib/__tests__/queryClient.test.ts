import { describe, it, expect } from 'vitest';
import { ApiError } from '../api/client';
import { queryClient } from '../queryClient';
import { QueryClient } from '@tanstack/react-query';

describe('queryClient', () => {
  it('is a QueryClient instance', () => {
    expect(queryClient).toBeInstanceOf(QueryClient);
  });

  it('has staleTime set to 5 minutes', () => {
    const defaults = queryClient.getDefaultOptions();
    expect(defaults.queries?.staleTime).toBe(5 * 60 * 1000);
  });

  it('has gcTime set to 10 minutes', () => {
    const defaults = queryClient.getDefaultOptions();
    expect(defaults.queries?.gcTime).toBe(10 * 60 * 1000);
  });

  it('does not retry mutations by default', () => {
    const defaults = queryClient.getDefaultOptions();
    expect(defaults.mutations?.retry).toBe(0);
  });

  it('has refetchOnWindowFocus enabled', () => {
    const defaults = queryClient.getDefaultOptions();
    expect(defaults.queries?.refetchOnWindowFocus).toBe(true);
  });

  it('has refetchOnReconnect enabled', () => {
    const defaults = queryClient.getDefaultOptions();
    expect(defaults.queries?.refetchOnReconnect).toBe(true);
  });

  it('has networkMode=online for queries', () => {
    const defaults = queryClient.getDefaultOptions();
    expect(defaults.queries?.networkMode).toBe('online');
  });

  it('has networkMode=online for mutations', () => {
    const defaults = queryClient.getDefaultOptions();
    expect(defaults.mutations?.networkMode).toBe('online');
  });

  it('retry function returns false for 404 ApiError', () => {
    const defaults = queryClient.getDefaultOptions();
    const retryFn = defaults.queries?.retry;
    if (typeof retryFn === 'function') {
      const err = new ApiError(404, 'NOT_FOUND', 'not found');
      expect(retryFn(0, err)).toBe(false);
    }
  });

  it('retry function returns false for 401 ApiError', () => {
    const defaults = queryClient.getDefaultOptions();
    const retryFn = defaults.queries?.retry;
    if (typeof retryFn === 'function') {
      const err = new ApiError(401, 'UNAUTH', 'unauthorized');
      expect(retryFn(0, err)).toBe(false);
    }
  });

  it('retry function returns true for server errors under max retries', () => {
    const defaults = queryClient.getDefaultOptions();
    const retryFn = defaults.queries?.retry;
    if (typeof retryFn === 'function') {
      expect(retryFn(0, new Error('server error'))).toBe(true);
      expect(retryFn(1, new Error('server error'))).toBe(true);
      expect(retryFn(2, new Error('server error'))).toBe(true);
      expect(retryFn(3, new Error('server error'))).toBe(false); // exceeds max
    }
  });
});
