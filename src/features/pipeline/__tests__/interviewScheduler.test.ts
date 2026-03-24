import { describe, it, expect, vi, beforeEach } from 'vitest';
import { autoScheduleInterview }  from '../services/interviewScheduler';
import { useToastStore }          from '@/shared/stores/toastStore';
import { INITIAL_JOBS }           from '@/data';
import type { Candidate }         from '@/types';

const MOCK_CANDIDATE: Candidate = {
  id: 'c-test-001', name: 'Amara Dube', email: 'amara@example.com',
  role: 'Senior Product Designer', stage: 'Applied', stageKey: 'Applied',
  source: 'CV Upload', score: 88, applied: 'Today', initials: 'AD',
};
const MOCK_JOB = INITIAL_JOBS[0]!;

describe('autoScheduleInterview', () => {
  beforeEach(() => { useToastStore.setState({ toasts: [] }); });

  it('returns AutoScheduleResult with all required fields', async () => {
    const onScheduled = vi.fn();
    const result = await autoScheduleInterview(MOCK_CANDIDATE, MOCK_JOB, onScheduled);

    expect(result).toHaveProperty('interviewId');
    expect(result).toHaveProperty('candidateId', 'c-test-001');
    expect(result).toHaveProperty('date');
    expect(result).toHaveProperty('time');
    expect(result).toHaveProperty('duration', 45);
    expect(result).toHaveProperty('meetingLink');
    expect(result).toHaveProperty('emailSent');
    expect(result).toHaveProperty('emailLogId');
  });

  it('meetingLink matches Google Meet pattern', async () => {
    const result = await autoScheduleInterview(MOCK_CANDIDATE, MOCK_JOB, vi.fn());
    expect(result.meetingLink).toMatch(/^meet\.google\.com\/hf-/);
  });

  it('date is ISO format YYYY-MM-DD', async () => {
    const result = await autoScheduleInterview(MOCK_CANDIDATE, MOCK_JOB, vi.fn());
    expect(result.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('time is HH:MM format', async () => {
    const result = await autoScheduleInterview(MOCK_CANDIDATE, MOCK_JOB, vi.fn());
    expect(result.time).toMatch(/^\d{2}:\d{2}$/);
  });

  it('slot is not on a weekend', async () => {
    const result = await autoScheduleInterview(MOCK_CANDIDATE, MOCK_JOB, vi.fn());
    const dow = new Date(result.date).getDay();
    expect([0, 6]).not.toContain(dow);
  });

  it('emailSent is true (simulated success)', async () => {
    const result = await autoScheduleInterview(MOCK_CANDIDATE, MOCK_JOB, vi.fn());
    expect(result.emailSent).toBe(true);
  });

  it('calls onScheduled with interview and emailLog', async () => {
    const onScheduled = vi.fn();
    await autoScheduleInterview(MOCK_CANDIDATE, MOCK_JOB, onScheduled);

    expect(onScheduled).toHaveBeenCalledOnce();
    const [interview, emailLog] = onScheduled.mock.calls[0]!;
    expect(interview.candidate).toBe(MOCK_CANDIDATE.name);
    expect(interview.status).toBe('Scheduled');
    expect(interview.type).toBe('Screening');
    expect(emailLog.to).toBe(MOCK_CANDIDATE.email);
    expect(emailLog.status).toBe('SENT');
  });

  it('email variables contain candidate_name, job_title, meeting_link', async () => {
    const onScheduled = vi.fn();
    await autoScheduleInterview(MOCK_CANDIDATE, MOCK_JOB, onScheduled);
    const [, emailLog] = onScheduled.mock.calls[0]!;

    expect(emailLog.variables['candidate_name']).toBe(MOCK_CANDIDATE.name);
    expect(emailLog.variables['job_title']).toBe(MOCK_JOB.title);
    expect(emailLog.variables['meeting_link']).toMatch(/^meet\.google\.com/);
  });

  it('email variables contain interview_date and interview_time', async () => {
    const onScheduled = vi.fn();
    await autoScheduleInterview(MOCK_CANDIDATE, MOCK_JOB, onScheduled);
    const [, emailLog] = onScheduled.mock.calls[0]!;

    expect(emailLog.variables['interview_date']).toBeTruthy();
    expect(emailLog.variables['interview_time']).toMatch(/^\d{2}:\d{2}$/);
  });

  it('interview notes mention auto-scheduled', async () => {
    const onScheduled = vi.fn();
    await autoScheduleInterview(MOCK_CANDIDATE, MOCK_JOB, onScheduled);
    const [interview] = onScheduled.mock.calls[0]!;
    expect(interview.notes.toLowerCase()).toContain('auto');
  });

  it('shows success toast', async () => {
    await autoScheduleInterview(MOCK_CANDIDATE, MOCK_JOB, vi.fn());
    const { toasts } = useToastStore.getState();
    expect(toasts.some(t => t.title === 'Interview Scheduled')).toBe(true);
  });

  it('interview duration is a positive number', async () => {
    const onScheduled = vi.fn();
    await autoScheduleInterview(MOCK_CANDIDATE, MOCK_JOB, onScheduled);
    const [interview] = onScheduled.mock.calls[0]!;
    expect(interview.duration).toBeGreaterThan(0);
  });

  it('assigns a video link to the interview', async () => {
    const onScheduled = vi.fn();
    await autoScheduleInterview(MOCK_CANDIDATE, MOCK_JOB, onScheduled);
    const [interview] = onScheduled.mock.calls[0]!;
    expect(interview.videoLink).toMatch(/meet\.google\.com/);
  });
});
