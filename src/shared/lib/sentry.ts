/**
 * Sentry Initialisation
 * ──────────────────────
 * Dynamically imported — only loaded in production when DSN is set.
 * Tracks performance (LCP, FCP, TTFB) and unhandled errors.
 */

import { env } from './env';

export function initSentry(): void {
  if (!env.VITE_SENTRY_DSN) return;

  // In a real project: import * as Sentry from '@sentry/react'
  // and initialise with the config below.
  console.warn('[Sentry] Would initialise with:', {
    dsn:         env.VITE_SENTRY_DSN,
    environment: env.VITE_ENV,
    release:     env.VITE_APP_VERSION,
    tracesSampleRate: env.VITE_ENV === 'production' ? 0.1 : 1.0,
    replaysSessionSampleRate: 0.05,
    replaysOnErrorSampleRate: 1.0,
    integrations: ['BrowserTracing', 'Replay'],
  });
}
