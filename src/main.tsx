/**
 * Application Entry Point
 * ────────────────────────
 * • Validates environment at startup (Zod)
 * • Initialises Sentry before mounting
 * • Wraps tree in Providers (QueryClient + ErrorBoundary)
 * • Imports global CSS
 */

import React from 'react';
import ReactDOM from 'react-dom/client';

// Validate env first — crashes loudly if misconfigured
import { env } from '@/shared/lib/env';

// Sentry initialisation (no-op if DSN not set)
if (env.VITE_SENTRY_DSN && env.VITE_ENV === 'production') {
  // Dynamic import keeps Sentry out of the dev bundle entirely
  void import('./shared/lib/sentry').then(m => m.initSentry());
}

import App       from './App';
import { Providers } from './app/Providers';
import './styles.css';
import './styles/global.css';

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('[HireFlow] Root element #root not found in DOM');

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <Providers>
      <App />
    </Providers>
  </React.StrictMode>,
);
