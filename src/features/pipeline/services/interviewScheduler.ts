/**
 * Automated Interview Scheduler
 * 
 * Triggered when recruiter clicks ACCEPT on a candidate.
 * Finds the next available slot, creates the interview,
 * and dispatches the confirmation email automatically.
 */

import { logger }         from '@/shared/lib/logger';
import { useToastStore }  from '@/shared/stores/toastStore';
import { EMAIL_TEMPLATES } from '@/data';
import type { Candidate, Interview, Job, AutoScheduleResult, EmailLog } from '@/types';

//  Availability slots (in production: fetched from Google Calendar API) 

const BASE_DATE = new Date('2026-03-23');

function getNextSlots(count: number): Array<{ date: string; time: string }> {
  const slots: Array<{ date: string; time: string }> = [];
  const times = ['09:00','10:00','11:00','14:00','15:00','16:00'];
  let day = 0;

  while (slots.length < count) {
    const d = new Date(BASE_DATE);
    d.setDate(d.getDate() + day);
    const dow = d.getDay();
    // Skip weekends
    if (dow !== 0 && dow !== 6) {
      const dateStr = d.toISOString().slice(0, 10);
      times.forEach(t => {
        if (slots.length < count) slots.push({ date: dateStr, time: t });
      });
    }
    day++;
  }
  return slots;
}

function generateMeetLink(): string {
  const code = Math.random().toString(36).slice(2, 5) + '-' +
               Math.random().toString(36).slice(2, 5) + '-' +
               Math.random().toString(36).slice(2, 5);
  return `meet.google.com/hf-${code}`;
}

//  Email templating 

function populateTemplate(
  template: string,
  vars: Record<string, string>,
): string {
  return Object.entries(vars).reduce(
    (t, [k, v]) => t.replaceAll(`{{${k}}}`, v).replaceAll(`[${k}]`, v),
    template,
  );
}

async function sendEmail(
  to:          string,
  subject:     string,
  _body:       string,
  templateKey: string,
  variables:   Record<string, string>,
): Promise<EmailLog> {
  const log: EmailLog = {
    id:          `email-${Date.now()}`,
    to,
    subject,
    templateKey,
    variables,
    status:      'PENDING',
  };

  try {
    // In production: POST /api/emails/send via emailService
    // Here we simulate a 300ms network round-trip
    await new Promise(r => setTimeout(r, 300));

    logger.info('[Email] Sent', { to, subject, templateKey });
    return { ...log, status: 'SENT', sentAt: new Date().toISOString() };

  } catch (err) {
    logger.error('[Email] Failed', { to, error: String(err) });
    return { ...log, status: 'FAILED', errorMsg: String(err) };
  }
}

//  Main scheduler 

export async function autoScheduleInterview(
  candidate:  Candidate,
  job:        Job,
  onScheduled:(interview: Interview, emailLog: EmailLog) => void,
): Promise<AutoScheduleResult> {
  logger.info('[Scheduler] Starting auto-schedule', {
    candidate: candidate.id,
    job:       job.id,
  });

  // 1. Fetch next available slot
  const [slot] = getNextSlots(1);
  if (!slot) throw new Error('No available slots found');

  // 2. Generate meeting link
  const meetingLink = generateMeetLink();

  // 3. Build interview record
  const interview: Interview = {
    id:           Date.now().toString(),
    candidate:    candidate.name,
    role:         job.title,
    type:         'Screening',
    date:         slot.date,
    time:         slot.time,
    duration:     45,
    interviewers: 'Tino Dube',
    videoLink:    meetingLink,
    notes:        'Auto-scheduled on accept',
    status:       'Scheduled',
  };

  // 4. Prepare email variables
  const interviewDateObj = new Date(`${slot.date}T${slot.time}:00`);
  const formattedDate    = interviewDateObj.toLocaleDateString('en-GB', {
    weekday:'long', year:'numeric', month:'long', day:'numeric',
  });

  const variables: Record<string, string> = {
    candidate_name: candidate.name,
    Name:           candidate.name,
    job_title:      job.title,
    Role:           job.title,
    interview_date: formattedDate,
    Date:           formattedDate,
    interview_time: slot.time,
    Time:           slot.time,
    meeting_link:   meetingLink,
    Type:           'Screening',
  };

  // 5. Retrieve template from Connections (EMAIL_TEMPLATES) + auto-populate
  const rawTemplate = EMAIL_TEMPLATES['Interview Invite'] ?? '';
  const emailBody   = populateTemplate(rawTemplate, variables);
  const subject     = `Interview Invitation — ${job.title} at HireFlow`;

  // 6. Dispatch email automatically
  const emailLog = await sendEmail(
    candidate.email,
    subject,
    emailBody,
    'Interview Invite',
    variables,
  );

  // 7. Notify app state
  onScheduled(interview, emailLog);

  useToastStore.getState().addToast(
    'Interview Scheduled',
    `${candidate.name} → ${slot.date} at ${slot.time}. Email ${emailLog.status === 'SENT' ? 'sent ' : 'FAILED '}`,
    emailLog.status === 'SENT' ? 'green' : 'amber',
  );

  logger.info('[Scheduler] Complete', {
    interviewId: interview.id,
    emailStatus: emailLog.status,
    slot,
  });

  return {
    interviewId:  interview.id,
    candidateId:  candidate.id,
    date:         slot.date,
    time:         slot.time,
    duration:     interview.duration,
    meetingLink,
    emailSent:    emailLog.status === 'SENT',
    emailLogId:   emailLog.id,
  };
}
