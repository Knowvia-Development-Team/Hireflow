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
  const { isAuthed, login, user } = useAuthStore();

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
  const [portalJob,  setPortalJob]  = useState<Job | null>(null);

  //  Toast shorthand 
  const showToast = useCallback((title: string, msg: string, color: ToastColor = 'blue'): void => {
    useToastStore.getState().addToast(title, msg, color);
  }, []);

  //  Audit + activity helpers 
  const addAudit = useCallback((action: string, actor = 'Tino Dube'): void => {
    setAuditLog(prev => [{ actor, action, time: 'Just now' }, ...prev]);
  }, []);

  const addActivity = useCallback((color: string, text: string): void => {
    // sanitize() prevents XSS from any user-supplied content
    setActivity(prev => [{ color, text: sanitize(text), time: 'Just now' }, ...prev.slice(0, 9)]);
  }, []);

  //  Navigation 
  const showProfile = useCallback((candidate: Candidate): void => {
    setSelectedCandidate(candidate);
    setViewRaw('profile');
  }, []);

  //  Candidate mutations 
  const advanceCandidate = useCallback((candidate: Candidate): void => {
    const next = STAGE_PROGRESSION[candidate.stageKey] ?? STAGE_PROGRESSION[candidate.stage];
    if (!next) { showToast('Already at final stage', '', 'blue'); return; }

    const apply = (c: Candidate): Candidate =>
      c.id === candidate.id
        ? { ...c, stage: next, stageKey: next.split(' ')[0] as CandidateStageKey }
        : c;

    setCandidates(prev => prev.map(apply));
    setSelectedCandidate(prev =>
      prev?.id === candidate.id
        ? { ...prev, stage: next, stageKey: next.split(' ')[0] as CandidateStageKey }
        : prev,
    );
    showToast('Stage Advanced', `${candidate.name} → ${next}`, 'green');
    addAudit(`Advanced ${candidate.name} → ${next}`);
    addActivity('var(--blue2)', `<strong>${candidate.name}</strong> moved to <strong>${next}</strong>`);
    logger.info('Candidate advanced', { id: candidate.id, from: candidate.stage, to: next });
  }, [showToast, addAudit, addActivity]);

  const rejectCandidate = useCallback((candidate: Candidate): void => {
    const apply = (c: Candidate): Candidate =>
      c.id === candidate.id ? { ...c, stage: 'Rejected', stageKey: 'Rejected' as CandidateStageKey } : c;

    setCandidates(prev => prev.map(apply));
    setSelectedCandidate(prev =>
      prev?.id === candidate.id ? { ...prev, stage: 'Rejected', stageKey: 'Rejected' as CandidateStageKey } : prev,
    );
    showToast('Candidate Rejected', `${candidate.name} moved to rejected.`, 'blue');
    addAudit(`Rejected: ${candidate.name}`);
    logger.info('Candidate rejected', { id: candidate.id });
  }, [showToast, addAudit]);

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
    } catch (e) {
      logger.error('Job creation failed', { error: String(e) });
      showToast('Validation Error', e instanceof Error ? e.message : 'Invalid form data', 'amber');
    }
  }, [showToast, addAudit, addActivity]);

  //  Candidate mutations 
  const addCandidateManual = useCallback((form: NewCandidateFormData): void => {
    try {
      const validated = parseOrThrow(NewCandidateSchema, form);
      const name = `${validated.fname} ${validated.lname}`.trim();
      const newCand: Candidate = {
        id: 'c' + Date.now().toString(),
        name, email: validated.email,
        role: 'Pending', stage: 'Applied', stageKey: 'Applied',
        source: validated.source, score: 65, applied: 'Today',
        initials: makeInitials(name),
      };
      setCandidates(prev => [newCand, ...prev]);
      showToast('Candidate Added', `${name} added.`, 'green');
      addAudit(`Added: ${name} via ${validated.source}`);
    } catch (e) {
      showToast('Validation Error', e instanceof Error ? e.message : 'Invalid form data', 'amber');
    }
  }, [showToast, addAudit]);

  //  Schedule interview 
  const scheduleInterview = useCallback((form: NewInterviewFormData): void => {
    try {
      const validated = parseOrThrow(ScheduleInterviewSchema, form);
      const newIv: Interview = {
        id:           Date.now(),
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
    } catch (e) {
      showToast('Validation Error', e instanceof Error ? e.message : 'Invalid form data', 'amber');
    }
  }, [showToast, addAudit]);

  //  Portal submit 
  const handlePortalSubmit = useCallback((form: PortalFormData, job: Job): void => {
    try {
      const validated = parseOrThrow(PortalApplicationSchema, form);
      const name = `${validated.fname} ${validated.lname}`.trim();
      const newCand: Candidate = {
        id:       'c' + Date.now().toString(),
        name, email: validated.email,
        role:     job.title, stage: 'Applied', stageKey: 'Applied',
        source:   validated.source || 'Direct',
        score:    Math.floor(Math.random() * 30) + 60,
        applied:  'Today', initials: makeInitials(name),
      };
      setCandidates(prev => [newCand, ...prev]);
      setJobs(prev => prev.map(j => j.id === job.id ? { ...j, applicants: j.applicants + 1 } : j));
      showToast('Application Received', `${name} applied for ${job.title}`, 'green');
      addAudit(`Application: ${name} → ${job.title}`);
      addActivity('var(--blue2)', `<strong>${name}</strong> applied for <strong>${job.title}</strong>`);
      logger.info('Portal application submitted', { job: job.id, name });
    } catch (e) {
      showToast('Validation Error', e instanceof Error ? e.message : 'Invalid form data', 'amber');
    }
  }, [showToast, addAudit, addActivity]);


  //  Login screen 
  if (!isAuthed) {
    return (
      <div className={isDark ? 'dark' : ''}>
        <Suspense fallback={<ViewSkeleton />}>
          <Login onLogin={(role: UserRole) => {
            login(
              { id: 'usr-001', name: 'Tino Dube', email: 'tino@hireflow.io', role, initials: 'TD' },
              'demo-access-token',
            );
            showToast('Welcome back, Tino!', `Signed in as ${role}`, 'green');
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
        />

        <main id="main-content" className="main" tabIndex={-1}>
          <ErrorBoundary fallback={<SectionError message="This view encountered an error." onRetry={() => setViewRaw('dashboard')} />}>
            <Suspense fallback={<ViewSkeleton />}>
              {view === 'dashboard'   && <Dashboard  candidates={candidates} jobs={jobs} activity={activity} showView={setViewRaw} />}
              {view === 'candidates'  && <Candidates candidates={candidates} showProfile={showProfile} openModal={setModal} />}
              {view === 'profile'     && <CandidateProfile candidate={selectedCandidate} jobs={jobs} showView={setViewRaw} advanceCandidate={advanceCandidate} rejectCandidate={rejectCandidate} openModal={setModal} showToast={showToast} onInterviewCreated={(iv) => setInterviews(prev => [...prev, iv])} onEmailLogged={(log) => addAudit(`Email ${log.status}: ${log.subject ?? ''}`)} />}
              {view === 'jobs'        && <Jobs jobs={jobs} openModal={setModal} setJobs={setJobs} showToast={showToast} openPortal={setPortalJob} />}
              {view === 'schedule'    && <Schedule interviews={interviews} setInterviews={setInterviews} openModal={setModal} showToast={showToast} />}
              {view === 'connections' && <Connections emails={emails} setEmails={setEmails} showToast={showToast} />}
              {view === 'settings'    && <Settings isDark={isDark} toggleTheme={toggleTheme} auditLog={auditLog} showToast={showToast} />}
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>

      {/* Notification panel */}
      <NotifPanel open={notifOpen} onClose={toggleNotif} />

      {/* Application portal overlay */}
      {portalJob !== null && (
        <Suspense fallback={null}>
          <ApplicationPortal
            job={portalJob}
            onClose={() => setPortalJob(null)}
            onSubmit={handlePortalSubmit}
            onPipelineComplete={(candidate) => {
              setCandidates(prev => {
                const exists = prev.some(c => c.email === candidate.email);
                if (exists) return prev;   // idempotency guard
                return [candidate, ...prev];
              });
              addActivity('var(--blue2)', `<strong>${candidate.name}</strong> auto-analysed — score <strong>${candidate.score}/100</strong>`);
              addAudit(`Auto-pipeline: ${candidate.name} scored ${candidate.score}`);
            }}
          />
        </Suspense>
      )}

      {/* Modals — lazy loaded, rendered via portal */}
      <Suspense fallback={null}>
        {openModal === 'new-job'    && <NewJobModal       onClose={closeModal} onSubmit={postJob} />}
        {openModal === 'add-cand'   && <AddCandidateModal  onClose={closeModal} onSubmit={addCandidateManual} />}
        {openModal === 'schedule'   && <ScheduleModal      onClose={closeModal} onSubmit={scheduleInterview} candidates={candidates} />}
      </Suspense>

      {/* Toast notifications — ARIA live region */}
      <div role="status" aria-live="polite" aria-atomic="false" className="sr-only">
        {toasts.map(t => <span key={t.id}>{t.title}: {t.msg}</span>)}
      </div>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
