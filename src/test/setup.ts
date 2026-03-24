/**
 * Vitest Global Test Setup
 * ─────────────────────────
 * Runs before every test file.
 */

import '@testing-library/jest-dom';
import { cleanup }         from '@testing-library/react';
import { afterEach, vi }   from 'vitest';

// Clean up rendered components after each test
afterEach(() => { cleanup(); });

// Silence console.error for expected React warnings in tests
const originalError = console.error.bind(console);
console.error = (...args: unknown[]) => {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('Warning:') || args[0].includes('Error: Not implemented'))
  ) return;
  originalError(...args);
};

// Mock matchMedia (not available in jsdom)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches:             false,
    media:               query,
    onchange:            null,
    addListener:         vi.fn(),
    removeListener:      vi.fn(),
    addEventListener:    vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent:       vi.fn(),
  })),
});

// Mock ResizeObserver (used by react-virtuoso)
(globalThis as typeof globalThis & { ResizeObserver: unknown }).ResizeObserver = vi.fn().mockImplementation(() => ({
  observe:    vi.fn(),
  unobserve:  vi.fn(),
  disconnect: vi.fn(),
}));

// Stub import.meta.env for tests
Object.assign(import.meta.env, {
  VITE_API_URL:    'http://localhost:3001',
  VITE_HF_ENABLED: 'true',
  VITE_ENV:        'development',
  VITE_APP_VERSION: '0.0.0',
});
