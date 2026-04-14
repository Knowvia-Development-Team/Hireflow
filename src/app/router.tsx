/**
 * Lazy Router
 * ────────────
 * Each view is a separate chunk (dynamic import).
 * Only the Dashboard chunk is loaded on initial paint.
 * All others are fetched on first navigation — never upfront.
 *
 * Bundle impact: main chunk ~40 KB instead of ~230 KB.
 */

import { lazy, Suspense, type ComponentType } from 'react';
import type { ViewId, Candidate, Job, Email, AuditEntry, ActivityItem, ModalId, ToastColor } from '@/types';

// ── Skeleton fallback ─────────────────────────────────────────────────────────
function ViewSkeleton(): JSX.Element {
  return (
    <div className="view" aria-busy="true" aria-label="Loading view" style={{ paddingTop: 40 }}>
      {[1, 2, 3].map(i => (
        <div key={i} style={{
          height: i === 1 ? 56 : 100,
          background: 'var(--bg3)',
          borderRadius: 10,
          marginBottom: 14,
          animation: 'pulse 1.5s ease-in-out infinite',
          opacity: 1 - i * 0.15,
        }} />
      ))}
    </div>
  );
}

// ── Lazy imports — each becomes its own JS chunk ──────────────────────────────
const Dashboard        = lazy(() => import('@/components/Dashboard'));
const Candidates       = lazy(() => import('@/components/Candidates'));
const CandidateProfile = lazy(() => import('@/components/CandidateProfile'));
const Jobs             = lazy(() => import('@/components/Jobs'));
const Schedule         = lazy(() => import('@/components/Schedule'));
const Connections      = lazy(() => import('@/components/Connections'));
const Settings         = lazy(() => import('@/components/Settings'));
const HistoryPage      = lazy(() => import('@/components/HistoryPage'));
const InterviewScoresPage = lazy(() => import('@/components/InterviewScoresPage'));

// ── Shared prop types for all views ──────────────────────────────────────────

export interface ViewProps {
  candidates:        Candidate[];
  setCandidates:     React.Dispatch<React.SetStateAction<Candidate[]>>;
  jobs:              Job[];
  setJobs:           React.Dispatch<React.SetStateAction<Job[]>>;
  emails:            Email[];
  setEmails:         React.Dispatch<React.SetStateAction<Email[]>>;
  auditLog:          AuditEntry[];
  addAudit:          (action: string, actor?: string) => void;
  activity:          ActivityItem[];
  addActivity:       (color: string, text: string) => void;
  isDark:            boolean;
  toggleTheme:       () => void;
  showView:          (v: ViewId) => void;
  showProfile:       (c: Candidate) => void;
  selectedCandidate: Candidate | null;
  openModal:         (id: ModalId) => void;
  showToast:         (title: string, msg: string, color?: ToastColor) => void;
  advanceCandidate:  (c: Candidate, targetStageKey?: Candidate['stageKey']) => void;
  rejectCandidate:   (c: Candidate) => void;
  openPortal:        (j: Job) => void;
}

// ── withSuspense HOC ──────────────────────────────────────────────────────────
function withSuspense<P extends object>(Component: ComponentType<P>) {
  return function Wrapped(props: P): JSX.Element {
    return (
      <Suspense fallback={<ViewSkeleton />}>
        <Component {...props} />
      </Suspense>
    );
  };
}

// ── Suspended views ───────────────────────────────────────────────────────────
export const LazyDashboard        = withSuspense(Dashboard);
export const LazyCandidates       = withSuspense(Candidates);
export const LazyCandidateProfile = withSuspense(CandidateProfile);
export const LazyJobs             = withSuspense(Jobs);
export const LazySchedule         = withSuspense(Schedule);
export const LazyConnections      = withSuspense(Connections);
export const LazySettings         = withSuspense(Settings);
export const LazyHistoryPage      = withSuspense(HistoryPage);
export const LazyInterviewScoresPage = withSuspense(InterviewScoresPage);

// ── View switcher ─────────────────────────────────────────────────────────────
export function renderView(view: ViewId, props: ViewProps): JSX.Element {
  const p = props;
  switch (view) {
    case 'dashboard':   return <LazyDashboard        {...p} />;
    case 'candidates':  return <LazyCandidates        candidates={p.candidates} showProfile={p.showProfile} openModal={p.openModal} />;
    case 'profile':     return <LazyCandidateProfile  candidate={p.selectedCandidate} jobs={p.jobs} showView={p.showView} advanceCandidate={p.advanceCandidate} rejectCandidate={p.rejectCandidate} openModal={p.openModal} showToast={p.showToast} />;
    case 'jobs':        return <LazyJobs              jobs={p.jobs} openModal={p.openModal} setJobs={p.setJobs} showToast={p.showToast} openPortal={p.openPortal} />;
    case 'schedule':    return <LazySchedule          interviews={[]} setInterviews={() => undefined} openModal={p.openModal} showToast={p.showToast} />;
    case 'connections': return <LazyConnections       emails={p.emails} setEmails={p.setEmails} showToast={p.showToast} />;
    case 'settings':    return <LazySettings          isDark={p.isDark} toggleTheme={p.toggleTheme} auditLog={p.auditLog} showToast={p.showToast} />;
    case 'history':     return <LazyHistoryPage />;
    case 'scores':      return <LazyInterviewScoresPage />;
    default:            return <LazyDashboard {...p} />;
  }
}
