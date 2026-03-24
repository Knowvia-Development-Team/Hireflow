import { describe, it, expect, afterEach } from 'vitest';
import { setAccessToken, getAccessToken, ApiError, NetworkError } from '../client';

describe('Token management', () => {
  afterEach(() => { setAccessToken(null); });

  it('getAccessToken returns null initially', () => {
    setAccessToken(null);
    expect(getAccessToken()).toBeNull();
  });

  it('setAccessToken stores a token in memory', () => {
    setAccessToken('test-jwt-abc123');
    expect(getAccessToken()).toBe('test-jwt-abc123');
  });

  it('setAccessToken can clear the token', () => {
    setAccessToken('some-token');
    setAccessToken(null);
    expect(getAccessToken()).toBeNull();
  });

  it('token is module-level (shared across imports)', () => {
    setAccessToken('shared-token');
    // Import the same module — should see the same value
    expect(getAccessToken()).toBe('shared-token');
  });
});

describe('ApiError', () => {
  it('creates error with correct properties', () => {
    const err = new ApiError(404, 'NOT_FOUND', 'Resource not found', { id: '123' });
    expect(err.status).toBe(404);
    expect(err.code).toBe('NOT_FOUND');
    expect(err.message).toBe('Resource not found');
    expect(err.details).toEqual({ id: '123' });
  });

  it('is an instance of Error', () => {
    const err = new ApiError(500, 'SERVER_ERROR', 'oops');
    expect(err).toBeInstanceOf(Error);
  });

  it('has name ApiError', () => {
    const err = new ApiError(400, 'BAD', 'bad request');
    expect(err.name).toBe('ApiError');
  });

  it('can be caught as Error', () => {
    expect(() => { throw new ApiError(403, 'FORBIDDEN', 'no access'); }).toThrow(Error);
  });

  it('works without details parameter', () => {
    const err = new ApiError(401, 'UNAUTH', 'not authenticated');
    expect(err.details).toBeUndefined();
  });
});

describe('NetworkError', () => {
  it('has default message', () => {
    const err = new NetworkError();
    expect(err.message).toBe('Network request failed');
  });

  it('accepts custom message', () => {
    const err = new NetworkError('Connection timeout');
    expect(err.message).toBe('Connection timeout');
  });

  it('has name NetworkError', () => {
    expect(new NetworkError().name).toBe('NetworkError');
  });

  it('is an instance of Error', () => {
    expect(new NetworkError()).toBeInstanceOf(Error);
  });
});
