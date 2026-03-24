import { describe, it, expect } from 'vitest';
import { getPillClass, getScorePips, getSourceClass, getRoleClass, fmtDate, fmtDateLabel, makeInitials, clamp100 } from '@/utils';

describe('getPillClass()', () => {
  it('maps Final Round to pill-open', () => { expect(getPillClass('Final Round')).toBe('pill-open'); });
  it('maps Offer Sent to pill-open',  () => { expect(getPillClass('Offer Sent')).toBe('pill-open'); });
  it('maps Screening to pill-open',   () => { expect(getPillClass('Screening')).toBe('pill-open'); });
  it('maps Interview to pill-open',   () => { expect(getPillClass('Interview')).toBe('pill-open'); });
  it('maps Applied to pill-closed',   () => { expect(getPillClass('Applied')).toBe('pill-closed'); });
  it('maps Rejected to pill-red',     () => { expect(getPillClass('Rejected')).toBe('pill-red'); });
  it('maps Draft to pill-draft',      () => { expect(getPillClass('Draft')).toBe('pill-draft'); });
  it('fallback to pill-blue',         () => { expect(getPillClass('Unknown')).toBe('pill-blue'); });
  it('is case-insensitive',           () => { expect(getPillClass('SCREENING')).toBe('pill-open'); });
});

describe('getScorePips()', () => {
  it('returns 5 pip colours', () => { expect(getScorePips(80)).toHaveLength(5); });
  it('score 100 → all green', () => {
    getScorePips(100).forEach(p => expect(p).toBe('var(--green)'));
  });
  it('score 0 → all grey', () => {
    getScorePips(0).forEach(p => expect(p).toBe('var(--bor2)'));
  });
  it('score 80 → at least 4 green pips', () => {
    expect(getScorePips(80).filter(p => p === 'var(--green)').length).toBeGreaterThanOrEqual(4);
  });
  it('score 60 → includes amber pips', () => {
    expect(getScorePips(60).filter(p => p === 'var(--amber)').length).toBeGreaterThan(0);
  });
});

describe('getSourceClass()', () => {
  it('LinkedIn  → src-linkedin',  () => expect(getSourceClass('LinkedIn')).toBe('src-linkedin'));
  it('Referral  → src-referral',  () => expect(getSourceClass('Referral')).toBe('src-referral'));
  it('Job Board → src-jobboard',  () => expect(getSourceClass('Job Board')).toBe('src-jobboard'));
  it('Direct    → src-direct',    () => expect(getSourceClass('Direct')).toBe('src-direct'));
  it('Unknown   → src-direct',    () => expect(getSourceClass('Unknown')).toBe('src-direct'));
  it('case-insensitive',          () => expect(getSourceClass('LINKEDIN')).toBe('src-linkedin'));
});

describe('getRoleClass()', () => {
  it('Admin       → role-admin',       () => expect(getRoleClass('Admin')).toBe('role-admin'));
  it('Recruiter   → role-recruiter',   () => expect(getRoleClass('Recruiter')).toBe('role-recruiter'));
  it('Interviewer → role-interviewer', () => expect(getRoleClass('Interviewer')).toBe('role-interviewer'));
  it('Read-only   → role-readonly',    () => expect(getRoleClass('Read-only')).toBe('role-readonly'));
  it('Unknown     → role-readonly',    () => expect(getRoleClass('Unknown')).toBe('role-readonly'));
});

describe('makeInitials()', () => {
  it('returns first letters of each word', () => expect(makeInitials('Tino Dube')).toBe('TD'));
  it('uppercases',                          () => expect(makeInitials('lena müller')).toBe('LM'));
  it('handles single name',                 () => expect(makeInitials('Zara')).toBe('Z'));
  it('caps at 2 characters',                () => expect(makeInitials('A B C D')).toBe('AB'));
  it('handles empty string',                () => expect(makeInitials('')).toBe(''));
});

describe('clamp100()', () => {
  it('clamps above 100', () => expect(clamp100(150)).toBe(100));
  it('clamps below 0',   () => expect(clamp100(-10)).toBe(0));
  it('rounds decimals',  () => expect(clamp100(72.6)).toBe(73));
  it('passes 0',         () => expect(clamp100(0)).toBe(0));
  it('passes 100',       () => expect(clamp100(100)).toBe(100));
  it('passes 50',        () => expect(clamp100(50)).toBe(50));
});

describe('fmtDate()', () => {
  it('returns YYYY-MM-DD format', () => {
    expect(fmtDate(new Date('2026-03-18'))).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
  it('returns correct date string', () => {
    expect(fmtDate(new Date('2026-03-18T00:00:00Z'))).toBe('2026-03-18');
  });
});

describe('fmtDateLabel()', () => {
  it('returns abbreviated day + number', () => {
    expect(fmtDateLabel(new Date('2026-03-16'))).toMatch(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun) \d+$/);
  });
  it('includes the correct day number', () => {
    expect(fmtDateLabel(new Date('2026-03-18'))).toContain('18');
  });
});
