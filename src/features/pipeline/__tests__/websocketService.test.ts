import { describe, it, expect, vi, beforeEach } from 'vitest';
import { wsService } from '../services/websocketService';

describe('WebSocketService', () => {
  beforeEach(() => {
    wsService.disconnect();
  });

  it('localEmit dispatches to registered handlers', () => {
    const handler = vi.fn();
    const unsub = wsService.on('CANDIDATE_NEW', handler);

    wsService.localEmit('CANDIDATE_NEW', { id: 'c-001', name: 'Test' });

    expect(handler).toHaveBeenCalledOnce();
    expect(handler).toHaveBeenCalledWith({ id: 'c-001', name: 'Test' });
    unsub();
  });

  it('unsubscribe removes the handler', () => {
    const handler = vi.fn();
    const unsub = wsService.on('PIPELINE_PROGRESS', handler);
    unsub();

    wsService.localEmit('PIPELINE_PROGRESS', { progress: 50 });

    expect(handler).not.toHaveBeenCalled();
  });

  it('multiple handlers for the same event all fire', () => {
    const h1 = vi.fn();
    const h2 = vi.fn();
    const u1 = wsService.on('CANDIDATE_UPDATED', h1);
    const u2 = wsService.on('CANDIDATE_UPDATED', h2);

    wsService.localEmit('CANDIDATE_UPDATED', { id: 'c-002' });

    expect(h1).toHaveBeenCalledOnce();
    expect(h2).toHaveBeenCalledOnce();
    u1(); u2();
  });

  it('handlers for different events do not cross-fire', () => {
    const h1 = vi.fn();
    const h2 = vi.fn();
    const u1 = wsService.on('CANDIDATE_NEW', h1);
    const u2 = wsService.on('EMAIL_SENT', h2);

    wsService.localEmit('CANDIDATE_NEW', {});

    expect(h1).toHaveBeenCalledOnce();
    expect(h2).not.toHaveBeenCalled();
    u1(); u2();
  });

  it('connect() does not throw when WebSocket is unavailable (test env)', () => {
    expect(() => wsService.connect('ws://localhost:9999/ws')).not.toThrow();
  });

  it('disconnect() is idempotent', () => {
    expect(() => {
      wsService.disconnect();
      wsService.disconnect();
    }).not.toThrow();
  });

  it('on() returns an unsubscribe function', () => {
    const unsub = wsService.on('INTERVIEW_SCHEDULED', vi.fn());
    expect(typeof unsub).toBe('function');
    unsub();
  });

  it('payload is forwarded without mutation', () => {
    const handler = vi.fn();
    const payload = { id: 'c-003', score: 92, nested: { a: 1 } };
    const unsub = wsService.on('CANDIDATE_NEW', handler);

    wsService.localEmit('CANDIDATE_NEW', payload);

    expect(handler.mock.calls[0]?.[0]).toStrictEqual(payload);
    unsub();
  });
});
