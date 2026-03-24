import { IconCircle } from '@/shared/components/ui/Icons';
import { useState } from 'react';
import { getPillClass, getScorePips, getSourceClass } from '@/utils';
import type { Candidate, ModalId } from '@/types';

type StageFilter = 'all' | 'Applied' | 'Screening' | 'Interview' | 'Final' | 'Offer' | 'Rejected';
const STAGES: StageFilter[] = ['all','Applied','Screening','Interview','Final','Offer','Rejected'];

interface Props {
  candidates:  Candidate[];
  showProfile: (c: Candidate) => void;
  openModal:   (id: ModalId) => void;
}

export default function Candidates({ candidates, showProfile, openModal }: Props): JSX.Element {
  const [filter, setFilter] = useState<StageFilter>('all');

  const filtered = filter === 'all'
    ? candidates
    : candidates.filter(c =>
        c.stageKey === filter ||
        c.stage.toLowerCase().startsWith(filter.toLowerCase()),
      );

  const newCount      = candidates.filter(c => c.stage === 'NEW').length;
  const offerCount    = candidates.filter(c => c.stageKey === 'Offer').length;

  return (
    <div className="view">
      <div className="pg-hd">
        <div>
          <div className="pg-tag">All Roles</div>
          <h1 className="pg-title">Candidates</h1>
          <div className="pg-sub">
            {candidates.length} total
            {newCount > 0 && <span className="new-badge" style={{ marginLeft:8, display:"inline-flex", alignItems:"center", gap:4 }}><IconCircle size={7} style={{color:"var(--blue2)"}} /> {newCount} NEW</span>}
            · {offerCount} in offer stage
          </div>
        </div>
        <div className="pg-actions">
          <button className="btn btn-ghost btn-sm">Export CSV</button>
          <button className="btn btn-primary btn-sm" onClick={() => openModal('add-cand')}>
            + Add Candidate
          </button>
        </div>
      </div>

      <div className="filters" role="tablist" aria-label="Filter by stage">
        {STAGES.map(s => (
          <div
            key={s}
            role="tab"
            aria-selected={filter === s}
            className={`filter${filter === s ? ' active' : ''}`}
            style={s === 'Rejected' && filter !== s ? { color:'var(--red)' } : undefined}
            onClick={() => setFilter(s)}
            onKeyDown={e => { if (e.key === 'Enter') setFilter(s); }}
            tabIndex={0}
          >
            {s === 'all' ? `All ${candidates.length}` : s === 'Final' ? 'Final Round' : s}
          </div>
        ))}
      </div>

      <div className="card">
        <div
          role="row"
          style={{ display:'grid', gridTemplateColumns:'32px 1fr 110px 140px 90px 70px 70px', gap:10, padding:'8px 16px', borderBottom:'1px solid var(--bor2)' }}
        >
          {['','Name','Stage','Role','Source','CV Score','Applied'].map((h,i) => (
            <div key={i} role="columnheader" style={{ fontFamily:'var(--mono)', fontSize:'0.58rem', letterSpacing:'1.5px', textTransform:'uppercase', color:'var(--g3)' }}>{h}</div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div role="status" style={{ padding:'32px', textAlign:'center', fontFamily:'var(--mono)', fontSize:'0.72rem', color:'var(--g3)' }}>
            No candidates in this stage.
          </div>
        )}

        {filtered.map(c => {
          const pips = getScorePips(c.score);
          const isNew = c.stage === 'NEW';
          return (
            <div
              key={c.id}
              className="cand-row"
              role="button"
              tabIndex={0}
              aria-label={`View profile for ${c.name}`}
              onClick={() => showProfile(c)}
              onKeyDown={e => { if (e.key === 'Enter') showProfile(c); }}
              style={c.stageKey === 'Rejected' ? { opacity:0.65 } : undefined}
            >
              <div className="cand-av" style={isNew ? { background:'var(--blue)', color:'#fff' } : undefined}>
                {c.initials}
              </div>
              <div>
                <div className="cand-name" style={{ display:'flex', alignItems:'center', gap:8 }}>
                  {c.name}
                  {isNew && <span className="new-tag">NEW</span>}
                </div>
                <div className="cand-email">{c.email}</div>
              </div>
              <div><span className={`pill ${getPillClass(c.stage)}`}><span className="pill-dot" aria-hidden="true" />{c.stage}</span></div>
              <div style={{ fontSize:'0.8rem', color:'var(--g2)' }}>{c.role}</div>
              <div><span className={`source-tag ${getSourceClass(c.source)}`}>{c.source}</span></div>
              <div className="score-pips" aria-label={`CV score ${c.score} out of 100`}>
                {pips.map((color,i) => <div key={i} className="pip" style={{ background:color }} />)}
              </div>
              <div style={{ fontFamily:'var(--mono)', fontSize:'0.62rem', color:'var(--g3)' }}>{c.applied}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
