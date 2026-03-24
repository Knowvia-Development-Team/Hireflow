import { IconLoader, IconCheck, IconCalendar } from '@/shared/components/ui/Icons';
import { useState, useCallback } from 'react';
import { getPillClass, getSourceClass } from '@/utils';
import { autoScheduleInterview } from '@/features/pipeline/services/interviewScheduler';
import { logger }                from '@/shared/lib/logger';
import type { Candidate, ModalId, ToastColor, ViewId, Job, Interview, EmailLog } from '@/types';

type ProfileTab = 'overview' | 'timeline' | 'notes' | 'scorecard';

const SKILLS = [
  { name:'Figma',          match:'yes'     as const },
  { name:'Design Systems', match:'yes'     as const },
  { name:'Prototyping',    match:'yes'     as const },
  { name:'User Research',  match:'partial' as const },
  { name:'Motion Design',  match:'no'      as const },
];
const SCORE_DIMS = ['Problem Solving','Communication','Technical Skills','Culture Fit'] as const;

interface Props {
  candidate:        Candidate | null;
  jobs:             Job[];
  showView:         (v: ViewId) => void;
  advanceCandidate: (c: Candidate) => void;
  rejectCandidate:  (c: Candidate) => void;
  openModal:        (id: ModalId) => void;
  showToast:        (title: string, msg: string, color?: ToastColor) => void;
  onInterviewCreated?: (iv: Interview) => void;
  onEmailLogged?:      (log: EmailLog)  => void;
}

export default function CandidateProfile({
  candidate, jobs, showView, advanceCandidate, rejectCandidate,
  openModal, showToast, onInterviewCreated, onEmailLogged,
}: Props): JSX.Element | null {
  const [tab,         setTab]         = useState<ProfileTab>('overview');
  const [accepting,   setAccepting]   = useState(false);
  const [acceptDone,  setAcceptDone]  = useState(false);
  const [scheduleInfo,setScheduleInfo]= useState<{ date:string; time:string; link:string } | null>(null);

  const matchedJob = jobs.find(j => j.title === candidate?.role) ?? jobs[0];

  const handleAccept = useCallback(async (): Promise<void> => {
    if (!candidate || !matchedJob) return;
    setAccepting(true);

    try {
      // 1. Advance to Screening (first acceptance step)
      advanceCandidate(candidate);

      // 2. Auto-schedule interview + send email
      const result = await autoScheduleInterview(
        candidate,
        matchedJob,
        (interview, emailLog) => {
          onInterviewCreated?.(interview);
          onEmailLogged?.(emailLog);
          logger.info('[Profile] Auto-scheduled', {
            interview: interview.id,
            email:     emailLog.status,
          });
        },
      );

      setScheduleInfo({ date: result.date, time: result.time, link: result.meetingLink });
      setAcceptDone(true);

    } catch (err) {
      showToast('Schedule Failed', String(err), 'amber');
    } finally {
      setAccepting(false);
    }
  }, [candidate, matchedJob, advanceCandidate, onInterviewCreated, onEmailLogged, showToast]);

  if (!candidate) return null;

  const [first, ...rest] = candidate.name.split(' ');
  const offset = 201 - (201 * candidate.score / 100);

  return (
    <div className="view">
      <div className="pg-hd">
        <div>
          <div className="pg-tag clickable" onClick={() => showView('candidates')}>← Back to Candidates</div>
          <h1 className="pg-title">{first} <em>{rest.join(' ')}</em></h1>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div className="pg-sub">Applying for: {candidate.role}</div>
            {candidate.stage === 'Applied' && !acceptDone && (
              <span style={{ fontFamily:'var(--mono)', fontSize:'0.62rem', background:'rgba(58,98,200,0.1)', color:'var(--blue2)', padding:'2px 8px', borderRadius:10, border:'1px solid rgba(58,98,200,0.25)' }}>
                NEW APPLICATION
              </span>
            )}
          </div>
        </div>
        <div className="pg-actions">
          <button className="btn btn-ghost btn-sm" onClick={() => showView('connections')}>Send Email</button>
          <button
            className="btn btn-ghost btn-sm"
            style={{ color:'var(--red)', borderColor:'rgba(220,38,38,0.3)' }}
            onClick={() => rejectCandidate(candidate)}
          >
            Reject
          </button>
          {!acceptDone ? (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => void handleAccept()}
              aria-busy={accepting}
              disabled={accepting}
              style={{ background:'var(--green)', borderColor:'var(--green)' }}
            >
              {accepting
              ? <span style={{display:"flex",alignItems:"center",gap:6}}><IconLoader size={13}/> Scheduling…</span>
              : <span style={{display:"flex",alignItems:"center",gap:6}}><IconCheck size={13}/> Accept + Schedule Interview</span>}
            </button>
          ) : (
            <span style={{ fontFamily:'var(--mono)', fontSize:'0.7rem', color:'var(--green)', padding:'6px 12px', background:'rgba(13,158,110,0.08)', border:'1px solid rgba(13,158,110,0.25)', borderRadius:6 }}>
              <span style={{display:"flex",alignItems:"center",gap:5}}><IconCheck size={11}/> Accepted</span>
            </span>
          )}
        </div>
      </div>

      {/* ── Auto-schedule confirmation banner ─────────────────────────────── */}
      {acceptDone && scheduleInfo && (
        <div style={{
          background:'rgba(13,158,110,0.06)', border:'1px solid rgba(13,158,110,0.2)',
          borderRadius:10, padding:'14px 18px', marginBottom:18,
          display:'flex', alignItems:'center', gap:14, flexWrap:'wrap',
        }}>
          <span style={{display:"flex",alignItems:"center",justifyContent:"center",width:36,height:36,background:"rgba(13,158,110,0.1)",borderRadius:9,flexShrink:0}}><IconCalendar size={18} style={{color:"var(--green)"}}/></span>
          <div>
            <div style={{ fontSize:'0.86rem', fontWeight:600, color:'var(--green)' }}>
              Interview automatically scheduled
            </div>
            <div style={{ fontFamily:'var(--mono)', fontSize:'0.72rem', color:'var(--g3)', marginTop:2 }}>
              {scheduleInfo.date} at {scheduleInfo.time} · {scheduleInfo.link} · Confirmation email sent
            </div>
          </div>
        </div>
      )}

      <div className="profile-layout">
        {/* Left column */}
        <div className="profile-left">
          <div className="profile-card">
            <div className="profile-avatar">{candidate.initials}</div>
            <div className="profile-name">{candidate.name}</div>
            <div className="profile-role">{candidate.role}</div>
            <div className="profile-stage">
              <span>Current stage</span>
              <span className={`pill ${getPillClass(candidate.stage)}`}><span className="pill-dot" />{candidate.stage}</span>
            </div>
            <div style={{ padding:'8px 0', borderBottom:'1px solid var(--bor)', marginBottom:10 }}>
              <div style={{ fontFamily:'var(--mono)', fontSize:'0.56rem', letterSpacing:1, textTransform:'uppercase', color:'var(--g3)', marginBottom:5 }}>Source</div>
              <span className={`source-tag ${getSourceClass(candidate.source)}`}>{candidate.source}</span>
            </div>
            <div className="profile-quick">
              <button className="btn btn-ghost btn-sm" onClick={() => showView('connections')}>Email</button>
              <button className="btn btn-ghost btn-sm" onClick={() => openModal('schedule')}>Schedule</button>
              {!acceptDone && (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => void handleAccept()}
                  disabled={accepting}
                >
                  Accept →
                </button>
              )}
            </div>
          </div>

          {/* CV Match */}
          <div className="cv-match">
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
              <span style={{ fontSize:'0.85rem', fontWeight:600, color:'var(--g1)' }}>CV Match</span>
              <span style={{ fontFamily:'var(--mono)', fontSize:'0.62rem', color:'var(--g3)' }}>Auto-analysed</span>
            </div>
            <div className="cv-match-top">
              <div className="cv-score-ring">
                <svg viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="32" fill="none" stroke="var(--bor2)" strokeWidth="8" />
                  <circle cx="40" cy="40" r="32" fill="none" stroke="var(--green)" strokeWidth="8"
                    strokeDasharray="201" strokeDashoffset={offset} strokeLinecap="round"
                    style={{ transform:'rotate(-90deg)', transformOrigin:'50% 50%' }} />
                </svg>
                <div className="cv-ring-num">
                  <span className="cv-big-num">{candidate.score}</span>
                  <span className="cv-denom">/100</span>
                </div>
              </div>
              <div>
                <div style={{ fontSize:'0.88rem', fontWeight:600, color:'var(--g1)', marginBottom:4 }}>
                  {candidate.score >= 80 ? 'Strong Match' : candidate.score >= 60 ? 'Good Match' : 'Partial Match'}
                </div>
                <div style={{ fontSize:'0.76rem', color:'var(--g3)' }}>AI-scored automatically</div>
              </div>
            </div>
            {SKILLS.map(s => (
              <div key={s.name} className="cv-skill-row">
                <span className="cv-skill-name">{s.name}</span>
                <span className={`cv-skill-match match-${s.match}`}>
                  {s.match === 'yes' ? 'Match' : s.match === 'partial' ? 'Partial' : 'Missing'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div>
          <div className="tabs">
            {(['overview','timeline','notes','scorecard'] as ProfileTab[]).map(t => (
              <div key={t} className={`tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>
                {t[0]!.toUpperCase() + t.slice(1)}
              </div>
            ))}
          </div>

          {tab === 'overview' && (
            <div className="card" style={{ padding:18 }}>
              <div style={{ fontFamily:'var(--serif)', fontSize:'1.1rem', marginBottom:12, color:'var(--white)' }}>About {first}</div>
              <p style={{ fontSize:'0.84rem', color:'var(--g2)', lineHeight:1.7 }}>
                Experienced {candidate.role} with a proven track record of delivering impact. Strong analytical and communication skills.
              </p>
              <div style={{ marginTop:16, display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                {([
                  ['Email',   candidate.email],
                  ['Role',    candidate.role],
                  ['Source',  candidate.source],
                  ['Applied', candidate.applied],
                ] as [string,string][]).map(([k,v]) => (
                  <div key={k}>
                    <div style={{ fontFamily:'var(--mono)', fontSize:'0.58rem', letterSpacing:1, textTransform:'uppercase', color:'var(--g3)', marginBottom:3 }}>{k}</div>
                    <div style={{ fontSize:'0.84rem', color:'var(--g1)' }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'timeline' && (
            <div className="card" style={{ padding:18 }}>
              <div className="timeline">
                {[
                  { cls:'tl-dot-green', title:'Application Submitted',  sub:`Via ${candidate.source}`,                time:'Application date' },
                  { cls:'tl-dot-blue',  title:'AI CV Analysis Complete', sub:`Score: ${candidate.score}/100 — auto-processed`, time:'Automatic' },
                  ...(acceptDone && scheduleInfo ? [
                    { cls:'tl-dot-green', title:'Accepted',              sub:'Moved to Screening',                     time:'Just now' },
                    { cls:'tl-dot-amber', title:'Interview Auto-Scheduled', sub:`${scheduleInfo.date} at ${scheduleInfo.time}`, time:'Just now' },
                    { cls:'tl-dot-green', title:'Confirmation Email Sent', sub:'Via HireFlow email service',            time:'Just now' },
                  ] : [
                    { cls:'tl-dot-amber', title:`Stage: ${candidate.stage}`, sub:'Current stage',                       time: '' },
                  ]),
                ].map((item, i) => (
                  <div key={i} className="tl-item">
                    <div className="tl-line" />
                    <div className={`tl-dot ${item.cls}`} />
                    <div className="tl-body">
                      <div className="tl-title">{item.title}</div>
                      <div className="tl-sub">{item.sub}</div>
                      {item.time && <div className="tl-time">{item.time}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'notes' && (
            <div className="card" style={{ padding:18 }}>
              <textarea className="form-input" rows={6} style={{ marginBottom:12 }}
                defaultValue="Candidate auto-analysed. Strong match score. Review AI insights on the Overview tab."
                placeholder="Add notes…" />
              <button className="btn btn-primary btn-sm">Save Notes</button>
            </div>
          )}

          {tab === 'scorecard' && (
            <div className="card" style={{ padding:18 }}>
              {SCORE_DIMS.map((dim, idx) => {
                const rating = 4 - (idx % 2);
                return (
                  <div key={dim} style={{ marginBottom:14 }}>
                    <div style={{ fontFamily:'var(--mono)', fontSize:'0.6rem', letterSpacing:1, textTransform:'uppercase', color:'var(--g3)', marginBottom:6 }}>{dim}</div>
                    <div style={{ display:'flex', gap:4 }}>
                      {([1,2,3,4,5] as const).map(star => (
                        <div key={star} style={{
                          width:28, height:28, borderRadius:5, cursor:'pointer',
                          background: star <= rating ? 'rgba(217,119,6,0.1)' : 'var(--bg3)',
                          border:`1px solid ${star <= rating ? 'rgba(217,119,6,0.3)' : 'var(--bor2)'}`,
                          display:'flex', alignItems:'center', justifyContent:'center',
                          color: star <= rating ? 'var(--amber)' : 'var(--g3)', fontSize:'1rem',
                        }} aria-label={`${star} star`}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill={star <= rating ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                      </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              <button className="btn btn-primary">Submit Scorecard</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
