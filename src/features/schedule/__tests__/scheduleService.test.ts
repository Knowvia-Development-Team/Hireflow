import { describe, it, expect } from 'vitest';
import { scheduleService } from '../services/scheduleService';

describe('scheduleService', () => {
  it('exports list, create, updateStatus, cancel', () => {
    expect(typeof scheduleService.list).toBe('function');
    expect(typeof scheduleService.create).toBe('function');
    expect(typeof scheduleService.updateStatus).toBe('function');
    expect(typeof scheduleService.cancel).toBe('function');
  });

  it('list() returns a Promise', () => {
    const p = scheduleService.list();
    expect(p).toBeInstanceOf(Promise);
    p.catch(() => undefined);
  });
});
