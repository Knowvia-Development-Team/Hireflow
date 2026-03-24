/**
 * React Query Client
 * ──────────────────
 * Configured for production:
 *   • 5-min stale time (avoids waterfall re-fetches)
 *   • Smart retry: no retry on 4xx client errors
 *   • Background refetch on window focus
 *   • Structural sharing to minimise re-renders
 */

import { QueryClient } from '@tanstack/react-query';
import { ApiError } from './api/client';

const RETRY_COUNT = 3;
const STALE_TIME  = 5 * 60 * 1000; // 5 min

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:          STALE_TIME,
      gcTime:             10 * 60 * 1000, // 10 min
      retry: (failCount, error) => {
        // Never retry auth or client errors
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) return false;
        return failCount < RETRY_COUNT;
      },
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30_000), // exponential backoff
      refetchOnWindowFocus:      true,
      refetchOnReconnect:        true,
      refetchOnMount:            true,
      networkMode:               'online',
    },
    mutations: {
      retry: 0, // never auto-retry mutations
      networkMode: 'online',
    },
  },
});
