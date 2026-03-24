import { describe, it, expect } from 'vitest';
import { emailService } from '../services/emailService';

describe('emailService', () => {
  it('exports list, send, markRead', () => {
    expect(typeof emailService.list).toBe('function');
    expect(typeof emailService.send).toBe('function');
    expect(typeof emailService.markRead).toBe('function');
  });

  it('list() returns a Promise', () => {
    const p = emailService.list();
    expect(p).toBeInstanceOf(Promise);
    p.catch(() => undefined);
  });
});
