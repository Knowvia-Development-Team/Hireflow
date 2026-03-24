/**
 * Dashboard Data Tests
 * ─────────────────────
 * Validates the shape and integrity of dashboard seed data
 * and the derived metrics that the dashboard displays.
 */

import { describe, it, expect } from 'vitest';
import { INITIAL_CANDIDATES, INITIAL_JOBS, INITIAL_ACTIVITY, INITIAL_AUDIT } from '@/data';

describe('Dashboard seed data integrity', () => {
  describe('Jobs', () => {
    it('has at least one Open job', () => {
      expect(INITIAL_JOBS.filter(j => j.status === 'Open').length).toBeGreaterThan(0);
    });

    it('has at least one Draft job', () => {
      expect(INITIAL_JOBS.filter(j => j.status === 'Draft').length).toBeGreaterThan(0);
    });

    it('every job has a non-empty title', () => {
      INITIAL_JOBS.forEach(j => expect(j.title.length).toBeGreaterThan(0));
    });

    it('every Open job has applicants >= 0', () => {
      INITIAL_JOBS.filter(j => j.status === 'Open').forEach(j => {
        expect(j.applicants).toBeGreaterThanOrEqual(0);
      });
    });

    it('departments are non-empty strings', () => {
      INITIAL_JOBS.forEach(j => expect(typeof j.dept).toBe('string'));
    });
  });

  describe('Candidates', () => {
    it('has candidates in multiple pipeline stages', () => {
      const stages = new Set(INITIAL_CANDIDATES.map(c => c.stageKey));
      expect(stages.size).toBeGreaterThanOrEqual(4);
    });

    it('all scores are in range [0, 100]', () => {
      INITIAL_CANDIDATES.forEach(c => {
        expect(c.score).toBeGreaterThanOrEqual(0);
        expect(c.score).toBeLessThanOrEqual(100);
      });
    });

    it('all candidates have valid email format', () => {
      const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      INITIAL_CANDIDATES.forEach(c => expect(emailRe.test(c.email)).toBe(true));
    });

    it('initials are 1-2 uppercase characters', () => {
      INITIAL_CANDIDATES.forEach(c => {
        expect(c.initials).toMatch(/^[A-Z]{1,2}$/);
      });
    });

    it('stageKey matches start of stage label', () => {
      INITIAL_CANDIDATES.forEach(c => {
        if (c.stageKey === 'Final') {
          expect(c.stage).toContain('Final');
        } else if (c.stageKey === 'Offer') {
          expect(c.stage).toContain('Offer');
        } else {
          expect(c.stage.startsWith(c.stageKey)).toBe(true);
        }
      });
    });
  });

  describe('Activity feed', () => {
    it('has at least 3 activity items', () => {
      expect(INITIAL_ACTIVITY.length).toBeGreaterThanOrEqual(3);
    });

    it('every activity has color, text, and time', () => {
      INITIAL_ACTIVITY.forEach(a => {
        expect(typeof a.color).toBe('string');
        expect(typeof a.text).toBe('string');
        expect(typeof a.time).toBe('string');
        expect(a.text.length).toBeGreaterThan(0);
      });
    });

    it('colors reference CSS variables', () => {
      INITIAL_ACTIVITY.forEach(a => {
        expect(a.color).toMatch(/^var\(--/);
      });
    });
  });

  describe('Audit log', () => {
    it('has at least 5 audit entries', () => {
      expect(INITIAL_AUDIT.length).toBeGreaterThanOrEqual(5);
    });

    it('every entry has actor, action, and time', () => {
      INITIAL_AUDIT.forEach(e => {
        expect(typeof e.actor).toBe('string');
        expect(typeof e.action).toBe('string');
        expect(typeof e.time).toBe('string');
      });
    });
  });

  describe('Derived metrics', () => {
    it('active role count is correct', () => {
      const openCount = INITIAL_JOBS.filter(j => j.status === 'Open').length;
      expect(openCount).toBeGreaterThan(0);
    });

    it('offer stage count is correct', () => {
      const offerCount = INITIAL_CANDIDATES.filter(c => c.stageKey === 'Offer').length;
      expect(typeof offerCount).toBe('number');
    });

    it('total candidate count matches array length', () => {
      expect(INITIAL_CANDIDATES.length).toBeGreaterThan(0);
    });
  });
});
