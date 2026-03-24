import { describe, it, expect, vi, afterEach } from 'vitest';
import { logger } from '../logger';

describe('logger', () => {
  afterEach(() => { vi.restoreAllMocks(); });

  it('logger.debug calls console.debug in development', () => {
    const spy = vi.spyOn(console, 'debug').mockImplementation(() => undefined);
    logger.debug('test message', { key: 'value' });
    expect(spy).toHaveBeenCalled();
    expect(spy.mock.calls[0]?.[0]).toContain('test message');
  });

  it('logger.info calls console.info', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    logger.info('info message');
    expect(spy).toHaveBeenCalled();
    expect(spy.mock.calls[0]?.[0]).toContain('INFO');
  });

  it('logger.warn calls console.warn', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    logger.warn('warning', { code: 42 });
    expect(spy).toHaveBeenCalled();
    expect(spy.mock.calls[0]?.[0]).toContain('WARN');
  });

  it('logger.error calls console.error', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    logger.error('error occurred', { detail: 'oops' });
    expect(spy).toHaveBeenCalled();
    expect(spy.mock.calls[0]?.[0]).toContain('ERROR');
  });

  it('logger.perf warns for slow operations (>1000ms)', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    logger.perf('slow-op', 1500);
    expect(spy).toHaveBeenCalled();
    expect(spy.mock.calls[0]?.[0]).toContain('Slow operation');
  });

  it('logger.perf debugs for fast operations (<1000ms)', () => {
    const spy = vi.spyOn(console, 'debug').mockImplementation(() => undefined);
    logger.perf('fast-op', 100);
    expect(spy).toHaveBeenCalled();
    expect(spy.mock.calls[0]?.[0]).toContain('Perf');
  });

  it('includes metadata in output', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    logger.info('event', { userId: '123', action: 'login' });
    expect(spy.mock.calls[0]?.[0]).toContain('userId');
  });
});
