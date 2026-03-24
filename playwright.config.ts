/**
 * Playwright E2E Configuration
 * ─────────────────────────────
 * Runs against the Vite preview server (production build).
 * Tests are isolated by browser context — no shared state.
 */

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir:     './e2e',
  testMatch:   '**/*.e2e.ts',
  fullyParallel: true,
  forbidOnly:  !!process.env['CI'],     // fail if test.only is committed
  retries:     process.env['CI'] ? 2 : 0,
  workers:     process.env['CI'] ? 1 : undefined,

  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ...(process.env['CI'] ? [['github'] as ['github']] : []),
  ],

  use: {
    baseURL:          'http://localhost:4173',  // vite preview port
    trace:            'on-first-retry',
    screenshot:       'only-on-failure',
    video:            'retain-on-failure',
    actionTimeout:    10_000,
    navigationTimeout:15_000,
  },

  projects: [
    {
      name:  'chromium',
      use:   { ...devices['Desktop Chrome'] },
    },
    {
      name:  'firefox',
      use:   { ...devices['Desktop Firefox'] },
    },
    {
      name:  'mobile-chrome',
      use:   { ...devices['Pixel 5'] },
    },
  ],

  // Start the preview server before running tests
  webServer: {
    command:             'npm run preview',
    url:                 'http://localhost:4173',
    reuseExistingServer: !process.env['CI'],
    timeout:             60_000,
  },
});
