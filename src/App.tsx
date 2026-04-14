import React, { useState, useCallback, Suspense, lazy } from 'react';
/**
 * App.tsx — Root Component
 * 
 * Wires together:
 *   • Auth store  (Zustand)
 *   • UI store    (Zustand — theme, modal, notif panel)
 *   • Toast store (Zustand)
 *   • Lazy view router (code splitting)
 *   • Error boundary around every view
 *   • Performance monitoring hook
 */



// Stores
import { useUiStore }   from '@/shared/stores/uiStore';
import { useToastStore } from '@/shared/stores/toastStore';
import { useAuthStore } from '@/features/auth/store/authStore';
import { authService } from '@/features/auth/services/authService';
import { get, post, put, setAccessToken } from '@/shared/lib/api/client';

// Shared hooks
import { usePerformance } from '@/shared/hooks/usePerformance';

// Layout components (NOT lazy — render on every page)
import Topbar    from './components/Topbar';
import Sidebar   from './components/Sidebar';
import NotifPanel from './components/NotifPanel';
import ToastContainer from './components/Toast';

// Error boundary
import { ErrorBoundary, SectionError } from './app/ErrorBoundary';

// Auth
const Login = lazy(() => import('./components/Login'));

// Lazy views — each is a separate JS chunk
const Dashboard        = lazy(() => import('./components/Dashboard'));
const Candidates       = lazy(() => import('./components/Candidates'));
const CandidateProfile = lazy(() => import('./components/CandidateProfile'));
const Jobs             = lazy(() => import('./components/Jobs'));
const Schedule         = lazy(() => import('./components/Schedule'));
const Connections      = lazy(() => import('./components/Connections'));
const Settings         = lazy(() => import('./components/Settings'));
const HistoryPage      = lazy(() => import('./components/HistoryPage'));
const InterviewScoresPage = lazy(() => import('./components/InterviewScoresPage'));

// Modals (lazy — only loaded when opened)
const NewJobModal       = lazy(() => import('./components/Modals').then(m => ({ default: m.NewJobModal })));
const AddCandidateModal = lazy(() => import('./components/Modals').then(m => ({ default: m.AddCandidateModal })));
const ScheduleModal     = lazy(() => import('./components/Modals').then(m => ({ default: m.ScheduleModal })));
const ApplicationPortal = lazy(() => import('./components/ApplicationPortal'));

import {
  INITIAL_JOBS, INITIAL_CANDIDATES, INITIAL_INTERVIEWS,
  INITIAL_EMAILS, INITIAL_AUDIT, INITIAL_ACTIVITY, STAGE_PROGRESSION,
} from './data';
import { makeInitials } from './utils';
import { sanitize }     from '@/shared/lib/sanitize';
import { pipelineBus }  from '@/features/pipeline/services/cvPipeline';
import { wsService }    from '@/features/pipeline/services/websocketService';
import { logger }       from '@/shared/lib/logger';
import { parseOrThrow } from '@/shared/lib/validators';
import { NewJobSchema, NewCandidateSchema, ScheduleInterviewSchema, PortalApplicationSchema } from '@/shared/lib/validators';

import type {
  ViewId, UserRole,
  Job, Candidate, Interview, Email,
  AuditEntry, ActivityItem, ToastColor,
  NewJobFormData, NewCandidateFormData, NewInterviewFormData,
  PortalFormData, CandidateStageKey,
} from './types';

//  Skeleton fallback 
function ViewSkeleton(): JSX.Element {
  return (
    <div className="view" aria-busy="true" aria-label="Loading">
      {[1, 2, 3].map(i => (
        <div key={i} style={{
          height: i === 1 ? 56 : 100, background: 'var(--bg3)',
          borderRadius: 10, marginBottom: 14,
          animation: 'pulse 1.5s ease-in-out infinite',
          opacity: 1 - i * 0.15,
        }} />
      ))}
    </div>
  );
}

function AuthLoading(): JSX.Element {
  return (
    <div className="auth-loading">
      <div className="auth-loading-card">
        <div className="auth-loading-logo">
          <span className="auth-loading-h">Hire</span>
          <span className="auth-loading-f">Flow</span>
        </div>
        <div className="auth-loading-title">Warming up your workspace</div>
        <div className="auth-loading-sub">Securing your session and preparing data…</div>
        <div className="auth-loading-spinner" aria-label="Loading" />
      </div>
    </div>
  );
}

export default function App(): JSX.Element {
  //  Performance monitoring 
  usePerformance();

  //  WebSocket connection + pipeline event bridge 
  React.useEffect(() => {
    // Connect to WS (gracefully degrades if server not running)
    wsService.connect(
      (import.meta.env.VITE_API_URL as string ?? 'http://localhost:3001')
        .replace('http', 'ws') + '/ws',
    );

    // Bridge pipeline EventBus → WS handlers → app state
    const handleNewCandidate = (e: Event): void => {
      const candidate = (e as CustomEvent<Candidate>).detail;
      wsService.localEmit('CANDIDATE_NEW', candidate);
    };
    pipelineBus.addEventListener('CANDIDATE_NEW', handleNewCandidate);

    const unsubNew = wsService.on<Candidate>('CANDIDATE_NEW', (candidate) => {
      setCandidates(prev => {
        if (prev.some(c => c.email === candidate.email)) return prev; // idempotent
        return [candidate, ...prev];
      });
    });

    const unsubScheduled = wsService.on('INTERVIEW_SCHEDULED', () => {
      // Interviews updated via onInterviewCreated callback — no extra action needed
    });

    return () => {
      pipelineBus.removeEventListener('CANDIDATE_NEW', handleNewCandidate);
      unsubNew();
      unsubScheduled();
      wsService.disconnect();
    };
  }, []);

  //  Stores 
  const { isDark, toggleTheme, openModal, setModal, closeModal, notifOpen, toggleNotif } = useUiStore();
  const { toasts, removeToast } = useToastStore();
  const { isAuthed, login, user, logout } = useAuthStore();
  const [authLoading, setAuthLoading] = useState(true);

  //  Local navigation state 
  const [view,              setViewRaw]           = useState<ViewId>('dashboard');
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

  //  Domain data (would be React Query in full prod) 
  const [jobs,       setJobs]       = useState<Job[]>(INITIAL_JOBS);
  const [candidates, setCandidates] = useState<Candidate[]>(INITIAL_CANDIDATES);
  const [interviews, setInterviews] = useState<Interview[]>(INITIAL_INTERVIEWS);
  const [emails,     setEmails]     = useState<Email[]>(INITIAL_EMAILS);
  const [auditLog,   setAuditLog]   = useState<AuditEntry[]>(INITIAL_AUDIT);
  const [activity,   setActivity]   = useState<ActivityItem[]>(INITIAL_ACTIVITY);
  const [interviewDefaults, setInterviewDefaults] = useState<{ defaultDuration: number; defaultType: string }>({ defaultDuration: 60, defaultType: 'Screening' });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [portalJob,  setPortalJob]  = useState<Job | null>(null);

  const mapJob = useCallback((j: any): Job => ({
    id: j.id,
    title: j.title ?? '',
    dept: j.dept ?? '',
    type: j.type ?? 'Full-time',
    location: j.location ?? '',
    status: j.status ?? 'Open',
    applicants: j.applicants ?? 0,
    salary: j.salary ?? '',
    skills: j.skills ?? '',
    desc: j.description ?? j.desc ?? '',
    created: j.created_at ? new Date(j.created_at).toLocaleDateString() : 'Today',
    requirements: j.requirements ?? undefined,
    responsibilities: j.responsibilities ?? undefined,
  }), []);

  const mapCandidate = useCallback((c: any): Candidate => ({
    id: c.id,
    name: c.name ?? '',
    email: c.email ?? '',
    role: c.role ?? '',
    stage: c.stage ?? 'Applied',
    stageKey: (c.stage_key ?? c.stage ?? 'Applied') as CandidateStageKey,
    source: c.source ?? '',
    score: c.score ?? 0,
    applied: c.applied ?? '',
    initials: makeInitials(c.name ?? ''),
    cvText: c.cv_text ?? null,
    cvUrl: c.cv_url ?? null,
    cvFilename: c.cv_filename ?? null,
    createdAt: c.created_at ?? null,
    appliedAt: c.applied_at ?? null,
    screeningAt: c.screening_at ?? null,
    interviewAt: c.interview_at ?? null,
    finalAt: c.final_at ?? null,
    offerAt: c.offer_at ?? null,
    hiredAt: c.hired_at ?? null,
    rejectedAt: c.rejected_at ?? null,
  }), []);

  const mapInterview = useCallback((iv: any): Interview => ({
    id: String(iv.id),
    candidate: iv.candidate ?? '',
    role: iv.role ?? '',
    type: iv.type ?? 'Screening',
    date: iv.date ? String(iv.date).slice(0, 10) : '',
    time: iv.time ?? '',
    duration: iv.duration ?? 0,
    interviewers: iv.interviewers ?? '',
    videoLink: iv.video_link ?? iv.videoLink ?? '',
    notes: iv.notes ?? '',
    status: iv.status ?? 'Scheduled',
  }), []);

  const mapEmail = useCallback((e: any): Email => ({
    id: String(e.id),
    from: e.from_name ?? e.from ?? '',
    addr: e.from_addr ?? e.addr ?? '',
    subject: e.subject ?? '',
    preview: e.preview ?? '',
    body: e.body ?? '',
    time: e.time ?? '',
    unread: Boolean(e.unread),
  }), []);

  const mapAudit = useCallback((a: any): AuditEntry => ({
    actor: a.actor ?? 'System',
    action: a.action ?? '',
    time: a.created_at ? new Date(a.created_at).toLocaleString() : 'Just now',
  }), []);

  const mapActivity = useCallback((a: any): ActivityItem => ({
    color: a.color ?? 'var(--blue2)',
    text: a.text ?? '',
    time: a.created_at ? new Date(a.created_at).toLocaleString() : 'Just now',
  }), []);

  const loadData = useCallback(async (): Promise<void> => {
    try {
      const [jobsRes, candidatesRes, interviewsRes, emailsRes, auditRes, activityRes] =
        await Promise.allSettled([
          get<any[]>('/api/data/jobs'),
          get<any[]>('/api/data/candidates'),
          get<any[]>('/api/data/interviews'),
          get<any[]>('/api/data/emails'),
          get<any[]>('/api/data/audit'),
          get<any[]>('/api/data/activity'),
        ]);

      if (jobsRes.status === 'fulfilled') setJobs(jobsRes.value.map(mapJob));
      if (candidatesRes.status === 'fulfilled') setCandidates(candidatesRes.value.map(mapCandidate));
      if (interviewsRes.status === 'fulfilled') setInterviews(interviewsRes.value.map(mapInterview));
      if (emailsRes.status === 'fulfilled') setEmails(emailsRes.value.map(mapEmail));
      if (auditRes.status === 'fulfilled') setAuditLog(auditRes.value.map(mapAudit));
      if (activityRes.status === 'fulfilled') setActivity(activityRes.value.map(mapActivity));
    } catch (e) {
      logger.warn('[App] Failed to load data from API', { error: String(e) });
    }
  }, [mapActivity, mapAudit, mapCandidate, mapEmail, mapInterview, mapJob]);

  React.useEffect(() => {
    void loadData();
  }, [isAuthed, loadData]);

  // Restore session on load
  React.useEffect(() => {
    let mounted = true;
    const restore = async (): Promise<void> => {
      const startedAt = Date.now();
      try {
        const token = await authService.refresh();
        if (!token) return;
        setAccessToken(token);
        const me = await authService.me();
        const initials = me.name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
        if (mounted) login({ ...me, initials }, token);
      } catch {
        // not logged in
      } finally {
        const minMs = 3000;
        const elapsed = Date.now() - startedAt;
        const delay = Math.max(minMs - elapsed, 0);
        window.setTimeout(() => {
          if (mounted) setAuthLoading(false);
        }, delay);
      }
    };
    void restore();
    return () => { mounted = false; };
  }, [login]);

  //  Toast shorthand 
  const showToast = useCallback((title: string, msg: string, color: ToastColor = 'blue'): void => {
    useToastStore.getState().addToast(title, msg, color);
  }, []);

  //  Audit + activity helpers 
  const addAudit = useCallback((action: string, actor = 'Tino Dube'): void => {
    void (async () => {
      try {
        const saved = await post<any>('/api/data/audit', { actor, action });
        setAuditLog(prev => [mapAudit(saved), ...prev]);
      } catch {
        setAuditLog(prev => [{ actor, action, time: 'Just now' }, ...prev]);
      }
    })();
  }, [mapAudit]);

  const addActivity = useCallback((color: string, text: string): void => {
    // sanitize() prevents XSS from any user-supplied content
    const clean = sanitize(text);
    void (async () => {
      try {
        const saved = await post<any>('/api/data/activity', { color, text: clean });
        setActivity(prev => [mapActivity(saved), ...prev.slice(0, 9)]);
      } catch {
        setActivity(prev => [{ color, text: clean, time: 'Just now' }, ...prev.slice(0, 9)]);
      }
    })();
  }, [mapActivity]);

  //  Navigation 
  const showProfile = useCallback((candidate: Candidate): void => {
    setSelectedCandidate(candidate);
    setViewRaw('profile');
  }, []);

  //  Candidate mutations 
  const stageLabel = (key: CandidateStageKey): string => ({
    Applied: 'Applied',
    Screening: 'Screening',
    Interview: 'Interview',
    Final: 'Final Round',
    Offer: 'Offer Sent',
    Rejected: 'Rejected',
    Hired: 'Hired',
  }[key]);

  const advanceCandidate = useCallback((candidate: Candidate, targetStageKey?: CandidateStageKey): void => {
    const nextKey = targetStageKey ?? (STAGE_PROGRESSION[candidate.stageKey] ?? STAGE_PROGRESSION[candidate.stage])?.split(' ')[0] as CandidateStageKey | undefined;
    if (!nextKey) { showToast('Already at final stage', '', 'blue'); return; }
    const next = targetStageKey ? stageLabel(nextKey) : (STAGE_PROGRESSION[candidate.stageKey] ?? STAGE_PROGRESSION[candidate.stage])!;
    if (!next) { showToast('Already at final stage', '', 'blue'); return; }
    const nowIso = new Date().toISOString();
    const stageUpdates: Partial<Candidate> = {
      stage: next,
      stageKey: nextKey,
      screeningAt: nextKey === 'Screening' ? nowIso : candidate.screeningAt,
      interviewAt: nextKey === 'Interview' ? nowIso : candidate.interviewAt,
      finalAt: nextKey === 'Final' ? nowIso : candidate.finalAt,
      offerAt: nextKey === 'Offer' ? nowIso : candidate.offerAt,
      hiredAt: nextKey === 'Hired' ? nowIso : candidate.hiredAt,
    };

    const apply = (c: Candidate): Candidate =>
      c.id === candidate.id ? { ...c, ...stageUpdates } : c;

    setCandidates(prev => prev.map(apply));
    setSelectedCandidate(prev =>
      prev?.id === candidate.id ? { ...prev, ...stageUpdates } : prev,
    );
    showToast('Stage Advanced', `${candidate.name} → ${next}`, 'green');
    addAudit(`Advanced ${candidate.name} → ${next}`);
    addActivity('var(--blue2)', `<strong>${candidate.name}</strong> moved to <strong>${next}</strong>`);
    logger.info('Candidate advanced', { id: candidate.id, from: candidate.stage, to: next });
    void (async () => {
      try {
        await put(`/api/data/candidates/${candidate.id}`, {
          name: candidate.name,
          email: candidate.email,
          role: candidate.role,
          stage: next,
          stage_key: nextKey,
          source: candidate.source,
          score: candidate.score,
          applied: candidate.applied,
          applied_at: candidate.appliedAt ?? null,
          screening_at: stageUpdates.screeningAt ?? candidate.screeningAt ?? null,
          interview_at: stageUpdates.interviewAt ?? candidate.interviewAt ?? null,
          final_at: stageUpdates.finalAt ?? candidate.finalAt ?? null,
          offer_at: stageUpdates.offerAt ?? candidate.offerAt ?? null,
          hired_at: stageUpdates.hiredAt ?? candidate.hiredAt ?? null,
          rejected_at: candidate.rejectedAt ?? null,
        });
      } catch {
        showToast('Update failed', 'Could not persist candidate stage.', 'amber');
        void loadData();
      }
    })();
    }, [showToast, addAudit, addActivity, loadData, mapJob]);

  const rejectCandidate = useCallback((candidate: Candidate): void => {
    const nowIso = new Date().toISOString();
    const apply = (c: Candidate): Candidate =>
      c.id === candidate.id ? { ...c, stage: 'Rejected', stageKey: 'Rejected' as CandidateStageKey, rejectedAt: nowIso } : c;

    setCandidates(prev => prev.map(apply));
    setSelectedCandidate(prev =>
      prev?.id === candidate.id ? { ...prev, stage: 'Rejected', stageKey: 'Rejected' as CandidateStageKey, rejectedAt: nowIso } : prev,
    );
    showToast('Candidate Rejected', `${candidate.name} moved to rejected.`, 'blue');
    addAudit(`Rejected: ${candidate.name}`);
    logger.info('Candidate rejected', { id: candidate.id });
    void (async () => {
      try {
        await put(`/api/data/candidates/${candidate.id}`, {
          name: candidate.name,
          email: candidate.email,
          role: candidate.role,
          stage: 'Rejected',
          stage_key: 'Rejected',
          source: candidate.source,
          score: candidate.score,
          applied: candidate.applied,
          applied_at: candidate.appliedAt ?? null,
          screening_at: candidate.screeningAt ?? null,
          interview_at: candidate.interviewAt ?? null,
          final_at: candidate.finalAt ?? null,
          offer_at: candidate.offerAt ?? null,
          hired_at: candidate.hiredAt ?? null,
          rejected_at: nowIso,
        });
      } catch {
        showToast('Update failed', 'Could not persist rejection.', 'amber');
        void loadData();
      }
    })();
  }, [showToast, addAudit, loadData]);

  //  Job mutations 
  const postJob = useCallback((form: NewJobFormData): void => {
    try {
      const validated = parseOrThrow(NewJobSchema, form);
      const newJob: Job = {
        id:         'job-' + Date.now().toString(36),
        title:      validated.title,
        dept:       validated.dept,
        type:       'Full-time',
        location:   validated.location,
        status:     'Open',
        applicants: 0,
        salary:     'Competitive',
        skills:     validated.skills ?? '',
        desc:       validated.desc ?? '',
        created:    'Today',
      };
      setJobs(prev => [newJob, ...prev]);
      showToast('Job Published', `${newJob.title} is now live.`, 'green');
      addAudit(`Posted: ${newJob.title}`);
      addActivity('var(--green)', `New job posted: <strong>${newJob.title}</strong>`);
      logger.info('Job created', { id: newJob.id, title: newJob.title });
      void (async () => {
        try {
          const saved = await post<any>('/api/data/jobs', {
            title: newJob.title,
            dept: newJob.dept,
            type: newJob.type,
            location: newJob.location,
            status: newJob.status,
            salary: newJob.salary,
            skills: newJob.skills,
            description: newJob.desc,
          });
          if (saved?.id) {
            setJobs(prev => prev.map(j => j.id === newJob.id ? mapJob(saved) : j));
          } else {
            void loadData();
          }
        } catch {
          showToast('Save failed', 'Could not persist job.', 'amber');
        }
      })();
    } catch (e) {
      logger.error('Job creation failed', { error: String(e) });
      showToast('Validation Error', e instanceof Error ? e.message : 'Invalid form data', 'amber');
    }
  }, [showToast, addAudit, addActivity, loadData]);

  //  Candidate mutations 
  const addCandidateManual = useCallback((form: NewCandidateFormData): void => {
    try {
      const validated = parseOrThrow(NewCandidateSchema, form);
      const name = `${validated.fname} ${validated.lname}`.trim();
      const nowIso = new Date().toISOString();
      const newCand: Candidate = {
        id: 'c' + Date.now().toString(),
        name, email: validated.email,
        role: 'Pending', stage: 'Applied', stageKey: 'Applied',
        source: validated.source, score: 65, applied: 'Today',
        initials: makeInitials(name),
        appliedAt: nowIso,
      };
      setCandidates(prev => [newCand, ...prev]);
      showToast('Candidate Added', `${name} added.`, 'green');
      addAudit(`Added: ${name} via ${validated.source}`);
      void (async () => {
        try {
          await post('/api/data/candidates', {
            name: newCand.name,
            email: newCand.email,
            role: newCand.role,
            stage: newCand.stage,
            stage_key: newCand.stageKey,
            source: newCand.source,
            score: newCand.score,
            applied: newCand.applied,
            applied_at: newCand.appliedAt,
          });
          void loadData();
        } catch {
          showToast('Save failed', 'Could not persist candidate.', 'amber');
        }
      })();
    } catch (e) {
      showToast('Validation Error', e instanceof Error ? e.message : 'Invalid form data', 'amber');
    }
  }, [showToast, addAudit, loadData]);

  //  Schedule interview 
  const scheduleInterview = useCallback((form: NewInterviewFormData): void => {
    try {
      const validated = parseOrThrow(ScheduleInterviewSchema, form);
      const newIv: Interview = {
        id:           Date.now().toString(),
        candidate:    validated.candidate,
        role:         '',
        type:         validated.type as Interview['type'],
        date:         validated.date,
        time:         validated.time,
        duration:     validated.duration,
        interviewers: validated.interviewers,
        videoLink:    'meet.google.com/hf-' + Math.random().toString(36).slice(2, 8),
        notes:        validated.notes ?? '',
        status:       'Scheduled',
      };
      setInterviews(prev => [...prev, newIv]);
      showToast('Interview Scheduled', `${validated.candidate} — ${validated.type}`, 'green');
      addAudit(`Scheduled ${validated.type} for ${validated.candidate}`);
      void (async () => {
        try {
          await post('/api/data/interviews', {
            candidate: newIv.candidate,
            role: newIv.role,
            type: newIv.type,
            date: newIv.date,
            time: newIv.time,
            duration: newIv.duration,
            interviewers: newIv.interviewers,
            video_link: newIv.videoLink,
            status: newIv.status,
          });
          void loadData();
        } catch {
          showToast('Save failed', 'Could not persist interview.', 'amber');
        }
      })();
    } catch (e) {
      showToast('Validation Error', e instanceof Error ? e.message : 'Invalid form data', 'amber');
    }
  }, [showToast, addAudit, loadData]);

  //  Portal submit 
  const handlePortalSubmit = useCallback((form: PortalFormData, job: Job): void => {
    try {
      const validated = parseOrThrow(PortalApplicationSchema, form);
      const name = `${validated.fname} ${validated.lname}`.trim();
      const nowIso = new Date().toISOString();
      const newCand: Candidate = {
        id:       'c' + Date.now().toString(),
        name, email: validated.email,
        role:     job.title, stage: 'Applied', stageKey: 'Applied',
        source:   validated.source || 'Direct',
        score:    0,
        applied:  'Today', initials: makeInitials(name),
        appliedAt: nowIso,
        cvText: validated.cvText ?? undefined,
        cvUrl: form.cvUrl ?? undefined,
        cvFilename: form.cvFilename ?? undefined,
      };
      setCandidates(prev => [newCand, ...prev]);
      setJobs(prev => prev.map(j => j.id === job.id ? { ...j, applicants: j.applicants + 1 } : j));
      showToast('Application Received', `${name} applied for ${job.title}`, 'green');
      addAudit(`Application: ${name} → ${job.title}`);
      addActivity('var(--blue2)', `<strong>${name}</strong> applied for <strong>${job.title}</strong>`);
      logger.info('Portal application submitted', { job: job.id, name });
      void (async () => {
        try {
          await post('/api/data/candidates', {
            name,
            email: validated.email,
            role: job.title,
            stage: 'Applied',
            stage_key: 'Applied',
            source: validated.source || 'Direct',
            score: 0,
            applied: 'Today',
            applied_at: nowIso,
            cv_text: validated.cvText ?? null,
            cv_url: form.cvUrl ?? null,
            cv_filename: form.cvFilename ?? null,
          });
          void loadData();
        } catch {
          showToast('Save failed', 'Could not persist application.', 'amber');
        }
      })();
    } catch (e) {
      showToast('Validation Error', e instanceof Error ? e.message : 'Invalid form data', 'amber');
    }
  }, [showToast, addAudit, addActivity, loadData]);


  //  Login screen 
  if (authLoading) {
    return (
      <div className={isDark ? 'dark' : ''}>
        <AuthLoading />
      </div>
    );
  }

  if (!isAuthed) {
    return (
      <div className={isDark ? 'dark' : ''}>
        <Suspense fallback={<ViewSkeleton />}>
          <Login onLogin={(user, accessToken) => {
            login(user, accessToken);
            showToast('Welcome back!', `Signed in as ${user.role}`, 'green');
          }} />
        </Suspense>
        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </div>
    );
  }

  //  App shell 
  return (
    <div className={`hf-app${isDark ? ' dark' : ''}`}>
      {/* Skip-to-content link — WCAG 2.4.1 */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only"
        style={{
          position: 'absolute', top: 8, left: 8, zIndex: 9999,
          padding: '6px 14px', background: 'var(--blue)', color: '#fff',
          borderRadius: 6, fontFamily: 'var(--sans)', fontSize: '0.84rem',
          textDecoration: 'none',
          transform: 'translateY(-100%)',
          transition: 'transform 0.15s',
        }}
        onFocus={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
        onBlur={e  => { e.currentTarget.style.transform = 'translateY(-100%)'; }}
      >
        Skip to main content
      </a>

      <Topbar
        isDark={isDark}
        toggleTheme={toggleTheme}
        onNotifClick={toggleNotif}
        onLogoClick={() => setViewRaw('dashboard')}
        candidates={candidates}
        jobs={jobs}
        setView={(v, c) => { if (v === 'profile' && c) setSelectedCandidate(c); setViewRaw(v); }}
      />

      <div className="hf-body">
        <Sidebar
          view={view}
          setView={setViewRaw}
          role={user?.role ?? 'Read-only'}
          candidates={candidates}
          jobs={jobs}
          emails={emails}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(p => !p)}
        />

        <main id="main-content" className="main" tabIndex={-1}>
          <ErrorBoundary fallback={<SectionError message="This view encountered an error." onRetry={() => setViewRaw('dashboard')} />}>
            <Suspense fallback={<ViewSkeleton />}>
              {view === 'dashboard'   && <Dashboard  candidates={candidates} jobs={jobs} activity={activity} interviews={interviews} emails={emails} showView={setViewRaw} />}
              {view === 'candidates'  && <Candidates candidates={candidates} showProfile={showProfile} openModal={setModal} />}
              {view === 'profile'     && <CandidateProfile candidate={selectedCandidate} jobs={jobs} showView={setViewRaw} advanceCandidate={advanceCandidate} rejectCandidate={rejectCandidate} openModal={setModal} showToast={showToast} onInterviewCreated={(iv) => {
                setInterviews(prev => [...prev, iv]);
                void (async () => {
                  try {
                    await post('/api/data/interviews', {
                      candidate: iv.candidate,
                      role: iv.role,
                      type: iv.type,
                      date: iv.date,
                      time: iv.time,
                      duration: iv.duration,
                      interviewers: iv.interviewers,
                      video_link: iv.videoLink,
                      status: iv.status,
                    });
                    void loadData();
                  } catch {
                    showToast('Save failed', 'Could not persist interview.', 'amber');
                  }
                })();
              }} onEmailLogged={(log) => addAudit(`Email ${log.status}: ${log.subject ?? ''}`)} />}
              {view === 'jobs'        && <Jobs jobs={jobs} openModal={setModal} setJobs={setJobs} showToast={showToast} openPortal={setPortalJob} onJobsChanged={() => void loadData()} />}
              {view === 'schedule'    && <Schedule interviews={interviews} setInterviews={setInterviews} openModal={setModal} showToast={showToast} />}
              {view === 'connections' && <Connections emails={emails} setEmails={setEmails} showToast={showToast} />}
              {view === 'settings'    && <Settings isDark={isDark} toggleTheme={toggleTheme} auditLog={auditLog} showToast={showToast} interviewDefaults={interviewDefaults} onUpdateInterviewDefaults={setInterviewDefaults} />}
              {view === 'history'     && <HistoryPage />}
              {view === 'scores'      && <InterviewScoresPage />}
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>

      {/* Notification panel */}
      <NotifPanel open={notifOpen} onClose={toggleNotif} activity={activity} />

      {/* Application portal overlay */}
      {portalJob !== null && (
        <Suspense fallback={null}>
          <ApplicationPortal
            job={portalJob}
            onClose={() => setPortalJob(null)}
            onSubmit={handlePortalSubmit}
            onPipelineComplete={(candidate) => {
              const nowIso = new Date().toISOString();
              setCandidates(prev => {
                const existing = prev.find(c => c.email === candidate.email);
                if (existing) {
                  return prev.map(c => c.email === candidate.email
                    ? { ...c, score: candidate.score, cvText: candidate.cvText ?? c.cvText, appliedAt: c.appliedAt ?? candidate.appliedAt ?? nowIso }
                    : c
                  );
                }
                return [{ ...candidate, appliedAt: candidate.appliedAt ?? nowIso }, ...prev];
              });
              addActivity('var(--blue2)', `<strong>${candidate.name}</strong> auto-analysed — score <strong>${candidate.score}/100</strong>`);
              addAudit(`Auto-pipeline: ${candidate.name} scored ${candidate.score}`);
              void (async () => {
                try {
                  let existing: Candidate | null = null;
                  try {
                    existing = await get<Candidate>(`/api/data/candidates/by-email?email=${encodeURIComponent(candidate.email)}`);
                  } catch {
                    existing = null;
                  }

                  if (existing) {
                    await put(`/api/data/candidates/${existing.id}`, {
                      name: existing.name,
                      email: existing.email,
                      role: existing.role,
                      stage: existing.stage,
                      stage_key: existing.stageKey,
                      source: existing.source,
                      score: candidate.score,
                      applied: existing.applied,
                      cv_text: candidate.cvText ?? existing.cvText ?? null,
                      applied_at: existing.appliedAt ?? candidate.appliedAt ?? nowIso,
                      screening_at: existing.screeningAt ?? null,
                      interview_at: existing.interviewAt ?? null,
                      final_at: existing.finalAt ?? null,
                      offer_at: existing.offerAt ?? null,
                      hired_at: existing.hiredAt ?? null,
                      rejected_at: existing.rejectedAt ?? null,
                    });
                  } else {
                    await post('/api/data/candidates', {
                      name: candidate.name,
                      email: candidate.email,
                      role: candidate.role,
                      stage: candidate.stage,
                      stage_key: candidate.stageKey,
                      source: candidate.source,
                      score: candidate.score,
                      applied: candidate.applied,
                      cv_text: candidate.cvText ?? null,
                      applied_at: candidate.appliedAt ?? nowIso,
                    });
                  }
                  void loadData();
                } catch {
                  showToast('Save failed', 'Could not persist pipeline candidate.', 'amber');
                }
              })();
            }}
          />
        </Suspense>
      )}

      {/* Modals — lazy loaded, rendered via portal */}
      <Suspense fallback={null}>
        {openModal === 'new-job'    && <NewJobModal       onClose={closeModal} onSubmit={postJob} />}
        {openModal === 'add-cand'   && <AddCandidateModal  onClose={closeModal} onSubmit={addCandidateManual} />}
        {openModal === 'schedule'   && <ScheduleModal      onClose={closeModal} onSubmit={scheduleInterview} candidates={candidates} interviewDefaults={interviewDefaults} />}
      </Suspense>

      {/* Toast notifications — ARIA live region */}
      <div role="status" aria-live="polite" aria-atomic="false" className="sr-only">
        {toasts.map(t => <span key={t.id}>{t.title}: {t.msg}</span>)}
      </div>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
