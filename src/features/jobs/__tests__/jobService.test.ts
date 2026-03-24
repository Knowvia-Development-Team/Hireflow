import { describe, it, expect } from 'vitest';
import { jobService } from '../services/jobService';

describe('jobService', () => {
  it('exports list, create, publish, pause functions', () => {
    expect(typeof jobService.list).toBe('function');
    expect(typeof jobService.create).toBe('function');
    expect(typeof jobService.publish).toBe('function');
    expect(typeof jobService.pause).toBe('function');
  });

  it('list() returns a promise', () => {
    const p = jobService.list();
    expect(p).toBeInstanceOf(Promise);
    p.catch(() => undefined);
  });

  it('publish() accepts a job id and returns a promise', () => {
    const p = jobService.publish('job-001');
    expect(p).toBeInstanceOf(Promise);
    p.catch(() => undefined);
  });
});
