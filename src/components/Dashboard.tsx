import type { Candidate, Job, ActivityItem, ViewId, Interview } from '@/types';

interface Props {
  candidates: Candidate[];
  jobs:       Job[];
  activity:   ActivityItem[];
  interviews: Interview[];
  showView:   (v: ViewId) => void;
}

const BAR_H  = [35, 50, 42, 60, 55, 70, 65, 80, 72, 90, 85, 95] as const;
const MONTHS = ['Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar'] as const;
const PIPE: [string, number, number][] = [
  ['Applied', 341, 100], ['Screening', 148, 43], ['Interview', 72, 21],
  ['Final Round', 34, 10], ['Offer', 27, 8],
];
const COMM = [
  { color: 'var(--red)',   text: 'Candidates not contacted in 3+ days', val: '14', cls: 'comm-bad'  },
  { color: 'var(--amber)', text: 'Unread messages in inbox',             val: '5',  cls: 'comm-warn' },
  { color: 'var(--amber)', text: 'Rejection letters unsent',             val: '8',  cls: 'comm-warn' },
  { color: 'var(--green)', text: 'Offers awaiting response',             val: '3',  cls: 'comm-ok'   },
  { color: 'var(--green)', text: 'Scorecards submitted this week',       val: '24', cls: 'comm-ok'   },
] as const;

export default function Dashboard({ candidates, jobs, activity, interviews, showView }: Props): JSX.Element {
  const openJobs  = jobs.filter(j => j.status === 'Open').length;
  const offerCands = candidates.filter(c => c.stageKey === 'Offer').length;

  // Dynamic greeting based on time of day
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  
  // Format date as "Wednesday, 18 March 2026"
  const day = now.toLocaleDateString('en-GB', { weekday: 'long' });
  const date = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  // Count today's interviews
  const todayStr = now.toISOString().split('T')[0];
  const todayInterviews = interviews.filter(i => i.date === todayStr).length;

  return (
    <div className="view">
      <div className="pg-hd">
        <div>
          <div className="pg-tag">Overview</div>
          <h1 className="pg-title">{greeting}, <em>Tino.</em></h1>
          <div className="pg-sub">{day}, {date} · {todayInterviews} interviews today</div>
        </div>
        <div className="pg-actions">
          <button className="btn btn-ghost btn-sm" onClick={() => showView('schedule')}>View Schedule</button>
          <button className="btn btn-primary btn-sm" onClick={() => showView('jobs')}>Post a Job</button>
        </div>
      </div>

      <div className="stats-row">
        {[
          { lbl: 'Active Roles',     val: openJobs,            sub: <><span className="up">↑ 2</span> since last month</> },
          { lbl: 'Total Candidates', val: candidates.length,   sub: <><span className="up">↑ 34</span> this week</> },
          { lbl: 'In Offer Stage',   val: offerCands || 27,    sub: <><span className="up">↑ 4</span> new offers</> },
          { lbl: 'Time to Hire',     val: <>18<span style={{ fontSize: '1rem' }}>d</span></>, sub: <><span className="dn">↓ 2d</span> faster</> },
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
              {BAR_H.map((h, i) => <div key={i} className="lc-bar" style={{ height: `${h}%` }} />)}
            </div>
            <div className="chart-months">
              {MONTHS.map(m => <span key={m} className="chart-month">{m}</span>)}
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-hd">
            <span className="card-title">Hiring Pipeline</span>
            <span className="card-link" onClick={() => showView('candidates')}>View all →</span>
          </div>
          <div className="pipe-rows">
            {PIPE.map(([lbl, n, pct]) => (
              <div key={lbl} className="pipe-row">
                <div className="pipe-lbl">{lbl}</div>
                <div className="pipe-track"><div className="pipe-fill" style={{ width: `${pct}%` }} /></div>
                <div className="pipe-num">{n}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderTop: '1px solid var(--bor)' }}>
            {([['App→Screen', '1.2d'], ['Screen→Int.', '3.1d'], ['Int.→Offer', '6.7d']] as [string, string][]).map(([l, v], i) => (
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
            <div className="qs-item"><div className="qs-label">Avg CV Score</div><div className="qs-val">72</div><div className="qs-sub"><span className="up">↑ 4pts</span> vs last month</div></div>
            <div className="qs-item"><div className="qs-label">Strong Match (75+)</div><div className="qs-val">89</div><div className="qs-sub">26% of pipeline</div></div>
            <div className="qs-item"><div className="qs-label">Top Source</div><div className="qs-val" style={{ fontSize: '1rem', paddingTop: 4 }}>LinkedIn</div><div className="qs-sub">41% of applicants</div></div>
            <div className="qs-item"><div className="qs-label">Offer Accept Rate</div><div className="qs-val">92%</div><div className="qs-sub"><span className="up">↑ 4%</span> vs prev</div></div>
          </div>
        </div>
        <div className="card">
          <div className="card-hd">
            <span className="card-title">Communication Health</span>
            <span className="card-link" onClick={() => showView('connections')}>Open inbox →</span>
          </div>
          <div className="comm-rows">
            {COMM.map(({ color, text, val, cls }) => (
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
          {activity.map((a, i) => (
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
