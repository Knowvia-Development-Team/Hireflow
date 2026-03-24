/**
 * VirtualCandidateList
 * ─────────────────────
 * Uses react-virtuoso for windowed rendering.
 * With 100k+ candidates, only ~20 rows are in the DOM at any time.
 * This prevents the main thread from blocking on layout/paint.
 */

import { memo, useCallback } from 'react';
import { Virtuoso }          from 'react-virtuoso';
import { getPillClass, getScorePips, getSourceClass } from '@/utils';
import type { Candidate }    from '@/types';

interface RowProps {
  candidate:   Candidate;
  onSelect:    (c: Candidate) => void;
}

// Memoised row — only re-renders if its candidate data changes
const CandidateRow = memo(function CandidateRow({ candidate: c, onSelect }: RowProps): JSX.Element {
  const pips = getScorePips(c.score);
  return (
    <div
      className="cand-row"
      role="button"
      tabIndex={0}
      aria-label={`View profile for ${c.name}`}
      onClick={() => onSelect(c)}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onSelect(c); }}
      style={c.stageKey === 'Rejected' ? { opacity: 0.65 } : undefined}
    >
      <div className="cand-av">{c.initials}</div>
      <div>
        <div className="cand-name">{c.name}</div>
        <div className="cand-email">{c.email}</div>
      </div>
      <div>
        <span className={`pill ${getPillClass(c.stage)}`}>
          <span className="pill-dot" aria-hidden="true" />{c.stage}
        </span>
      </div>
      <div style={{ fontSize: '0.8rem', color: 'var(--g2)' }}>{c.role}</div>
      <div>
        <span className={`source-tag ${getSourceClass(c.source)}`}>{c.source}</span>
      </div>
      <div className="score-pips" aria-label={`CV score: ${c.score} out of 100`}>
        {pips.map((color, i) => <div key={i} className="pip" style={{ background: color }} />)}
      </div>
      <div style={{ fontFamily: 'var(--mono)', fontSize: '0.62rem', color: 'var(--g3)' }}>
        {c.applied}
      </div>
    </div>
  );
});

interface ListProps {
  candidates: Candidate[];
  onSelect:   (c: Candidate) => void;
}

export const VirtualCandidateList = memo(function VirtualCandidateList({ candidates, onSelect }: ListProps): JSX.Element {
  const renderItem = useCallback(
    (_index: number, c: Candidate) => <CandidateRow candidate={c} onSelect={onSelect} />,
    [onSelect],
  );

  if (candidates.length === 0) {
    return (
      <div role="status" style={{ padding: '32px', textAlign: 'center', fontFamily: 'var(--mono)', fontSize: '0.72rem', color: 'var(--g3)' }}>
        No candidates found.
      </div>
    );
  }

  return (
    <div>
      {/* Column headers */}
      <div
        role="row"
        aria-label="Column headers"
        style={{ display: 'grid', gridTemplateColumns: '32px 1fr 110px 140px 90px 70px 70px', gap: 10, padding: '8px 16px', borderBottom: '1px solid var(--bor2)' }}
      >
        {['', 'Name', 'Stage', 'Role', 'Source', 'CV Score', 'Applied'].map((h, i) => (
          <div key={i} role="columnheader" style={{ fontFamily: 'var(--mono)', fontSize: '0.58rem', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--g3)' }}>
            {h}
          </div>
        ))}
      </div>
      <Virtuoso
        data={candidates}
        itemContent={renderItem}
        style={{ height: 'calc(100vh - 340px)', minHeight: 200 }}
        aria-label="Candidates list"
        role="list"
      />
    </div>
  );
});
