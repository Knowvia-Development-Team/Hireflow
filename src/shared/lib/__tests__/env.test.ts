import { describe, it, expect } from 'vitest';
import { env } from '../env';

describe('env', () => {
  it('has a VITE_API_URL field', () => {
    expect(env.VITE_API_URL).toBeDefined();
    expect(typeof env.VITE_API_URL).toBe('string');
  });

  it('VITE_HF_ENABLED is a boolean', () => {
    expect(typeof env.VITE_HF_ENABLED).toBe('boolean');
  });

  it('VITE_ENV is a valid environment string', () => {
    expect(['development', 'staging', 'production']).toContain(env.VITE_ENV);
  });

  it('VITE_APP_VERSION is a string', () => {
    expect(typeof env.VITE_APP_VERSION).toBe('string');
  });

  it('VITE_API_URL defaults to localhost in test', () => {
    expect(env.VITE_API_URL).toBe('http://localhost:3001');
  });
});
