import { useMemo } from 'react';
import { useAuthStore } from '@/features/auth/store/authStore';
import type { Candidate, Job, ActivityItem, ViewId, Interview, Email } from '@/types';

interface Props {
  candidates: Candidate[];
  jobs:       Job[];
  activity:   ActivityItem[];
  interviews: Interview[];
  emails:     Email[];
  showView:   (v: ViewId) => void;
}

const PIPE_STAGES = [
  { key: 'Applied', label: 'Applied' },
  { key: 'Screening', label: 'Screening' },
  { key: 'Interview', label: 'Interview' },
  { key: 'Final', label: 'Final Round' },
  { key: 'Offer', label: 'Offer' },
] as const;

export default function Dashboard({ candidates, jobs, activity, interviews, emails, showView }: Props): JSX.Element {
  const user = useAuthStore(s => s.user);
  const openJobs = jobs.filter(j => j.status === 'Open').length;
  const offerCands = candidates.filter(c => c.stageKey === 'Offer').length;
  const firstName = user?.name?.split(' ')[0] ?? 'there';

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const day = now.toLocaleDateString('en-GB', { weekday: 'long' });
  const date = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const todayStr = now.toISOString().split('T')[0];
  const todayInterviews = interviews.filter(i => i.date === todayStr).length;

  const parseCandidateDate = (candidate: Candidate): Date | null => {
    if (candidate.appliedAt) {
      const d = new Date(candidate.appliedAt);
      return Number.isNaN(d.getTime()) ? null : d;
    }
    if (candidate.createdAt) {
      const d = new Date(candidate.createdAt);
      return Number.isNaN(d.getTime()) ? null : d;
    }
    if (!candidate.applied) return null;
    const applied = candidate.applied.trim();
    if (!applied) return null;
    if (applied.toLowerCase() === 'today') return new Date();
    const parsed = new Date(`${applied} ${now.getFullYear()}`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const stageDurations = useMemo(() => {
    const toDate = (value?: string | null): Date | null => {
      if (!value) return null;
      const d = new Date(value);
      return Number.isNaN(d.getTime()) ? null : d;
    };
    const appToScreen: number[] = [];
    const screenToInterview: number[] = [];
    const interviewToOffer: number[] = [];

    candidates.forEach(c => {
      const appliedAt = toDate(c.appliedAt);
      const screeningAt = toDate(c.screeningAt);
      const interviewAt = toDate(c.interviewAt);
      const offerAt = toDate(c.offerAt);

      if (appliedAt && screeningAt) appToScreen.push((screeningAt.getTime() - appliedAt.getTime()) / 86400000);
      if (screeningAt && interviewAt) screenToInterview.push((interviewAt.getTime() - screeningAt.getTime()) / 86400000);
      if (interviewAt && offerAt) interviewToOffer.push((offerAt.getTime() - interviewAt.getTime()) / 86400000);
    });

    const avg = (vals: number[]): string => {
      if (!vals.length) return '—';
      const v = Math.round(vals.reduce((sum, n) => sum + n, 0) / vals.length);
      return `${v}d`;
    };

    return {
      appToScreen: avg(appToScreen),
      screenToInterview: avg(screenToInterview),
      interviewToOffer: avg(interviewToOffer),
    };
  }, [candidates]);

  const monthlySeries = useMemo(() => {
    const months: { label: string; key: string; count: number }[] = [];
    const cursor = new Date(now.getFullYear(), now.getMonth(), 1);
    cursor.setMonth(cursor.getMonth() - 11);
    for (let i = 0; i < 12; i += 1) {
      const label = cursor.toLocaleDateString('en-GB', { month: 'short' });
      const key = `${cursor.getFullYear()}-${cursor.getMonth()}`;
      months.push({ label, key, count: 0 });
      cursor.setMonth(cursor.getMonth() + 1);
    }

    candidates.forEach(candidate => {
      const d = parseCandidateDate(candidate);
      if (!d) return;
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const bucket = months.find(m => m.key === key);
      if (bucket) bucket.count += 1;
    });

    const max = Math.max(1, ...months.map(m => m.count));
    return months.map(m => ({
      label: m.label,
      height: Math.round((m.count / max) * 100),
      count: m.count,
    }));
  }, [candidates, now]);

  const pipeline = useMemo(() => {
    const total = Math.max(1, candidates.length);
    return PIPE_STAGES.map(stage => {
      const count = candidates.filter(c => c.stageKey === stage.key).length;
      const pct = Math.round((count / total) * 100);
      return { label: stage.label, count, pct };
    });
  }, [candidates]);

  const avgScore = candidates.length
    ? Math.round(candidates.reduce((sum, c) => sum + (c.score ?? 0), 0) / candidates.length)
    : 0;
  const strongMatches = candidates.filter(c => (c.score ?? 0) >= 75).length;
  const topSource = useMemo(() => {
    const counts = new Map<string, number>();
    candidates.forEach(c => {
      const source = c.source || 'Unknown';
      counts.set(source, (counts.get(source) ?? 0) + 1);
    });
    let top = '—';
    let max = 0;
    counts.forEach((val, key) => {
      if (val > max) { max = val; top = key; }
    });
    return top;
  }, [candidates]);

  const rejectedCount = candidates.filter(c => c.stageKey === 'Rejected').length;
  const hiredCount = candidates.filter(c => c.stageKey === 'Hired').length;
  const offerAcceptRate = (offerCands + hiredCount) > 0
    ? `${Math.round((hiredCount / (offerCands + hiredCount)) * 100)}%`
    : '—';

  const pendingContacts = useMemo(() => {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    return candidates.filter(c => {
      if (!['Applied', 'Screening'].includes(c.stageKey)) return false;
      const d = parseCandidateDate(c);
      return d ? d < threeDaysAgo : false;
    }).length;
  }, [candidates]);

  const scorecardsThisWeek = useMemo(() => {
    return activity.filter(a => a.text.toLowerCase().includes('scorecard')).length;
  }, [activity]);

  const unreadEmails = emails.filter(e => e.unread).length;

  const commItems = [
    { color: 'var(--red)',   text: 'Candidates not contacted in 3+ days', val: String(pendingContacts), cls: 'comm-bad' },
    { color: 'var(--amber)', text: 'Unread messages in inbox',             val: String(unreadEmails), cls: 'comm-warn' },
    { color: 'var(--amber)', text: 'Rejection letters unsent',             val: String(rejectedCount), cls: 'comm-warn' },
    { color: 'var(--green)', text: 'Offers awaiting response',             val: String(offerCands), cls: 'comm-ok' },
    { color: 'var(--green)', text: 'Scorecards submitted this week',       val: String(scorecardsThisWeek), cls: 'comm-ok' },
  ] as const;

  return (
    <div className="view">
      <div className="pg-hd">
        <div>
          <div className="pg-tag">Overview</div>
          <h1 className="pg-title">{greeting}, <em>{firstName}.</em></h1>
          <div className="pg-sub">{day}, {date}{todayInterviews > 0 ? ` · ${todayInterviews} interviews today` : ''}</div>
        </div>
        <div className="pg-actions">
          <button className="btn btn-ghost btn-sm" onClick={() => showView('schedule')}>View Schedule</button>
          <button className="btn btn-primary btn-sm" onClick={() => showView('jobs')}>Post a Job</button>
        </div>
      </div>

      <div className="stats-row">
        {[
          { lbl: 'Active Roles',     val: openJobs,         sub: <><span className="up">↑ {Math.max(0, openJobs - 1)}</span> active</> },
          { lbl: 'Total Candidates', val: candidates.length, sub: <><span className="up">↑ {Math.min(34, candidates.length)}</span> this week</> },
          { lbl: 'In Offer Stage',   val: offerCands,       sub: <><span className="up">↑ {offerCands}</span> awaiting response</> },
          { lbl: 'Offer Accept Rate', val: offerAcceptRate, sub: <><span className="up">↑ {hiredCount}</span> hired</> },
        ].map(({ lbl, val, sub }) => (
          <div key={lbl} className="stat">
            <div className="stat-lbl">{lbl}</div>
            <div className="stat-num">{val}</div>
            <div className="stat-sub">{sub}</div>
          </div>
        ))}
      </div>

      <div className="two-col">
        <div className="card">
          <div className="card-hd"><span className="card-title">Applications (12 months)</span></div>
          <div className="mini-chart">
            <div className="chart-label">Monthly Volume</div>
            <div className="chart-row">
              <div className="lc-axis" />
              {monthlySeries.map((m, i) => (
                <div key={`${m.label}-${i}`} className="lc-bar" style={{ height: `${m.height}%` }} title={`${m.count} applications`} />
              ))}
            </div>
            <div className="chart-months">
              {monthlySeries.map(m => <span key={m.label} className="chart-month">{m.label}</span>)}
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-hd">
            <span className="card-title">Hiring Pipeline</span>
            <span className="card-link" onClick={() => showView('candidates')}>View all →</span>
          </div>
          <div className="pipe-rows">
            {pipeline.map(({ label, count, pct }) => (
              <div key={label} className="pipe-row">
                <div className="pipe-lbl">{label}</div>
                <div className="pipe-track"><div className="pipe-fill" style={{ width: `${pct}%` }} /></div>
                <div className="pipe-num">{count}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderTop: '1px solid var(--bor)' }}>
            {([
              ['App→Screen', stageDurations.appToScreen],
              ['Screen→Int.', stageDurations.screenToInterview],
              ['Int.→Offer', stageDurations.interviewToOffer],
            ] as [string, string][]).map(([l, v], i) => (
              <div key={l} style={{ padding: '12px 14px', borderRight: i < 2 ? '1px solid var(--bor)' : undefined }}>
                <div className="stat-lbl">{l}</div>
                <div style={{ fontFamily: 'var(--serif)', fontSize: '1.2rem', color: 'var(--white)' }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="two-col">
        <div className="card">
          <div className="card-hd"><span className="card-title">Candidate Quality Signals</span></div>
          <div className="quality-grid">
            <div className="qs-item"><div className="qs-label">Avg CV Score</div><div className="qs-val">{avgScore}</div><div className="qs-sub"><span className="up">↑</span> from live data</div></div>
            <div className="qs-item"><div className="qs-label">Strong Match (75+)</div><div className="qs-val">{strongMatches}</div><div className="qs-sub">{candidates.length ? `${Math.round((strongMatches / candidates.length) * 100)}% of pipeline` : 'No candidates yet'}</div></div>
            <div className="qs-item"><div className="qs-label">Top Source</div><div className="qs-val" style={{ fontSize: '1rem', paddingTop: 4 }}>{topSource}</div><div className="qs-sub">{candidates.length ? 'Most common source' : 'No data yet'}</div></div>
            <div className="qs-item"><div className="qs-label">Offer Accept Rate</div><div className="qs-val">{offerAcceptRate}</div><div className="qs-sub"><span className="up">↑</span> based on hires/offers</div></div>
          </div>
        </div>
        <div className="card">
          <div className="card-hd">
            <span className="card-title">Communication Health</span>
            <span className="card-link" onClick={() => showView('connections')}>Open inbox →</span>
          </div>
          <div className="comm-rows">
            {commItems.map(({ color, text, val, cls }) => (
              <div key={text} className="comm-row">
                <div className="comm-left">
                  <div className="comm-dot" style={{ background: color }} />
                  <div className="comm-text">{text}</div>
                </div>
                <span className={`comm-num ${cls}`}>{val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-hd">
          <span className="card-title">Recent Activity</span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: '0.6rem', color: 'var(--green)', display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', display: 'inline-block', animation: 'pulse 2s infinite' }} />
            Live
          </span>
        </div>
        <div className="act-list">
          {activity.slice(0, 7).map((a, i) => (
            <div key={i} className="act-item">
              <div className="act-dot" style={{ background: a.color }} />
              <div className="act-body">
                <div className="act-text" dangerouslySetInnerHTML={{ __html: a.text }} />
                <div className="act-time">{a.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
