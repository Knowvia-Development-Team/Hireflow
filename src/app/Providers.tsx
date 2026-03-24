/**
 * Providers
 * ──────────
 * All context providers in one place.
 * Order matters: QueryClientProvider wraps everything that uses React Query.
 */

import type { ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools }  from '@tanstack/react-query-devtools';
import { queryClient }         from '@/shared/lib/queryClient';
import { ErrorBoundary }       from './ErrorBoundary';

interface Props { children: ReactNode; }

export function Providers({ children }: Props): JSX.Element {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        {children}
        {/* DevTools only load in development — zero production cost */}
        {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
