import { IconCircle, IconFileText, IconImage } from '@/shared/components/ui/Icons';
import { useState, useRef } from 'react';
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
  const [showUploadModal, setShowUploadModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log('Uploaded file:', file.name);
      setShowUploadModal(false);
    }
  };

  const handleGoogleDriveUpload = () => {
    alert('Google Drive integration would open here. Connect to Google Drive in Settings to enable this feature.');
    setShowUploadModal(false);
  };

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

      {/* CV Upload Modal */}
      {showUploadModal && (
        <div className="modal-back" onClick={e => { if (e.target === e.currentTarget) setShowUploadModal(false); }}>
          <div className="modal" style={{ maxWidth: 420 }}>
            <div className="modal-hd">
              <span className="modal-title">Upload Candidate CV</span>
              <button className="modal-x" onClick={() => setShowUploadModal(false)} aria-label="Close">×</button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: 16, color: 'var(--g2)', fontSize: '0.85rem' }}>Choose how you want to upload candidate CVs:</p>
              
              <button
                className="upload-option"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px',
                  background: 'var(--bg2)', border: '1px solid var(--bor)', borderRadius: 8,
                  width: '100%', cursor: 'pointer', marginBottom: 12, textAlign: 'left'
                }}
              >
                <div style={{ fontSize: '1.5rem' }}><IconFileText size={24} /></div>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--white)' }}>Upload from Computer</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--g3)' }}>PDF, DOC, DOCX (max 10MB)</div>
                </div>
              </button>

              <button
                className="upload-option"
                onClick={handleGoogleDriveUpload}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px',
                  background: 'var(--bg2)', border: '1px solid var(--bor)', borderRadius: 8,
                  width: '100%', cursor: 'pointer', textAlign: 'left'
                }}
              >
                <div style={{ fontSize: '1.5rem' }}><IconImage size={24} /></div>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--white)' }}>Import from Google Drive</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--g3)' }}>Select files from your Drive</div>
                </div>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
