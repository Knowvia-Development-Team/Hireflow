/**
 * candidateService shape tests
 * Tests that the service exports correctly-shaped API functions,
 * without making actual HTTP calls.
 */

import { describe, it, expect } from 'vitest';
import { candidateService } from '../services/candidateService';

describe('candidateService', () => {
  it('exports a list function', () => {
    expect(typeof candidateService.list).toBe('function');
  });

  it('exports a create function', () => {
    expect(typeof candidateService.create).toBe('function');
  });

  it('exports an advance function', () => {
    expect(typeof candidateService.advance).toBe('function');
  });

  it('exports a reject function', () => {
    expect(typeof candidateService.reject).toBe('function');
  });

  it('list() returns a promise', () => {
    // Will fail to resolve (no server) but must return a Promise
    const result = candidateService.list({});
    expect(result).toBeInstanceOf(Promise);
    // Prevent unhandled rejection
    result.catch(() => undefined);
  });
});
