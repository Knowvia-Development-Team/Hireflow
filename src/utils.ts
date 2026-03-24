import type { CandidateStageKey } from '@/types';

export function getPillClass(stage: string): string {
  const s = stage.toLowerCase();
  if (s.includes('final') || s.includes('offer') || s.includes('hired') ||
      s.includes('screen') || s.includes('interview')) return 'pill-open';
  if (s.includes('applied'))  return 'pill-closed';
  if (s.includes('reject'))   return 'pill-red';
  if (s.includes('draft'))    return 'pill-draft';
  return 'pill-blue';
}

export function getScorePips(score: number): string[] {
  const filled = Math.round((score / 100) * 5);
  return Array.from({ length: 5 }, (_, i) => {
    if (i >= filled) return 'var(--bor2)';
    if (filled >= 4) return 'var(--green)';
    if (filled >= 3) return 'var(--amber)';
    return 'var(--red)';
  });
}

export function getSourceClass(source: string): string {
  const s = source.toLowerCase();
  if (s.includes('linkedin')) return 'src-linkedin';
  if (s.includes('referral')) return 'src-referral';
  if (s.includes('job') || s.includes('board')) return 'src-jobboard';
  return 'src-direct';
}

export function getRoleClass(role: string): string {
  const r = role.toLowerCase().replace(/-/g, '');
  const map: Record<string, string> = {
    admin:       'role-admin',
    recruiter:   'role-recruiter',
    interviewer: 'role-interviewer',
    readonly:    'role-readonly',
  };
  return map[r] ?? 'role-readonly';
}

export function fmtDate(d: Date): string {
  return d.toISOString().split('T')[0] ?? '';
}

export function fmtDateLabel(d: Date): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
  return `${days[d.getDay()] ?? ''} ${d.getDate()}`;
}

export function makeInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function clamp100(v: number): number {
  return Math.max(0, Math.min(100, Math.round(v)));
}

export const STAGE_PROGRESSION: Readonly<Partial<Record<CandidateStageKey, string>>> = {
  Applied:     'Screening',
  Screening:   'Interview',
  Interview:   'Final Round',
  Final:       'Offer Sent',
  Offer:       'Hired',
};
