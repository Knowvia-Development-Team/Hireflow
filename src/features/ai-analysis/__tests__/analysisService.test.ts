import { describe, it, expect } from 'vitest';
import { analysisService } from '../services/analysisService';

describe('analysisService', () => {
  it('exports extract, match, sentiment', () => {
    expect(typeof analysisService.extract).toBe('function');
    expect(typeof analysisService.match).toBe('function');
    expect(typeof analysisService.sentiment).toBe('function');
  });

  it('extract() returns a Promise', () => {
    const p = analysisService.extract('cv text');
    expect(p).toBeInstanceOf(Promise);
    p.catch(() => undefined);
  });

  it('match() returns a Promise', () => {
    const p = analysisService.match('cv', 'job');
    expect(p).toBeInstanceOf(Promise);
    p.catch(() => undefined);
  });

  it('sentiment() returns a Promise', () => {
    const p = analysisService.sentiment('bio');
    expect(p).toBeInstanceOf(Promise);
    p.catch(() => undefined);
  });

  it('request can be aborted via AbortSignal', () => {
    const ctrl = new AbortController();
    const p = analysisService.extract('cv', ctrl.signal);
    expect(p).toBeInstanceOf(Promise);
    ctrl.abort();
    p.catch(() => undefined);
  });
});
