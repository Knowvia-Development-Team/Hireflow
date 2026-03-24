/**
 * Environment Configuration — Zod-validated at startup
 * ──────────────────────────────────────────────────────
 * If a required variable is missing the app crashes LOUDLY at boot,
 * not silently at runtime 3 hours later.
 */

import { z } from 'zod';

const EnvSchema = z.object({
  VITE_API_URL:     z.string().url().default('http://localhost:3001'),
  VITE_HF_ENABLED:  z.enum(['true', 'false']).default('true').transform(v => v === 'true'),
  VITE_SENTRY_DSN:  z.string().optional(),
  VITE_ENV:         z.enum(['development', 'staging', 'production']).default('development'),
  VITE_APP_VERSION: z.string().default('0.0.0'),
});

function parseEnv() {
  const result = EnvSchema.safeParse({
    VITE_API_URL:     import.meta.env.VITE_API_URL,
    VITE_HF_ENABLED:  import.meta.env.VITE_HF_ENABLED,
    VITE_SENTRY_DSN:  import.meta.env.VITE_SENTRY_DSN,
    VITE_ENV:         import.meta.env.VITE_ENV ?? import.meta.env.MODE,
    VITE_APP_VERSION: import.meta.env.VITE_APP_VERSION,
  });

  if (!result.success) {
    const missing = result.error.errors.map(e => `  • ${e.path.join('.')}: ${e.message}`).join('\n');
    throw new Error(`\n[ENV] Invalid environment configuration:\n${missing}\n`);
  }

  return result.data;
}

export const env = parseEnv();
export type Env  = typeof env;
