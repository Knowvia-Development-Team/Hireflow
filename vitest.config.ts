import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path  from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  test: {
    globals:     true,
    environment: 'jsdom',
    setupFiles:  ['./src/test/setup.ts'],
    include:     ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider:   'v8',
      reporter:   ['text', 'lcov', 'html'],
      include:    ['src/**/*.{ts,tsx}'],
      exclude: [
        // Test infrastructure
        'src/test/**',
        'src/**/*.d.ts',
        'src/**/*.test.*',
        'src/**/*.spec.*',
        // Entry points / shell — covered by E2E, not unit tests
        'src/main.tsx',
        'src/App.tsx',
        'src/app/router.tsx',
        'src/app/Providers.tsx',
        // Thin API service wrappers — tested via integration/E2E
        'src/features/*/services/**',
        'src/shared/lib/sentry.ts',
        // Legacy view components — being migrated to feature modules
        'src/components/**',
      ],
      thresholds: {
        branches:   75,
        functions:  75,
        lines:      75,
        statements: 75,
      },
    },
  },
});
