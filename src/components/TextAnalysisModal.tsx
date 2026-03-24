import { useState, useRef } from 'react';
import type { ReactNode } from 'react';
import type {
  ExtractResult, MatchResult, SentimentResult,
  AnalysisResult, ExtractedExperience, ExtractedEducation, ExtractResult as IR,
} from '@/types';

// ─── Colour palette ──────────────────────────────────────────────────────────

type TagColor = 'blue' | 'green' | 'amber' | 'purple' | 'red';

const PALETTE: Record<TagColor, readonly [string, string, string]> = {
  blue:   ['var(--blue-dim)',                'rgba(58,98,200,0.25)',   'var(--blue2)' ],
  green:  ['rgba(13,158,110,0.08)',          'rgba(13,158,110,0.25)', 'var(--green)' ],
  amber:  ['rgba(217,119,6,0.08)',           'rgba(217,119,6,0.25)', 'var(--amber)' ],
  purple: ['rgba(124,58,237,0.08)',          'rgba(124,58,237,0.25)','var(--purple)'],
  red:    ['rgba(220,38,38,0.07)',           'rgba(220,38,38,0.25)', 'var(--red)'   ],
};

// ─── Small presentational helpers ───────────────────────────────────────────

function Tag({ label, color = 'blue' }: { label: string; color?: TagColor }): JSX.Element {
  const [bg, border, text] = PALETTE[color];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', fontFamily: 'var(--mono)',
      fontSize: '0.65rem', padding: '3px 9px', borderRadius: 6,
      background: bg, border: `1px solid ${border}`, color: text, whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  );
}

interface SectionProps { title: string; icon: string; children: ReactNode; accent?: string; }
function Section({ title, icon, children, accent = 'var(--blue2)' }: SectionProps): JSX.Element {
  return (
    <div style={{ background: 'var(--bg3)', border: '1px solid var(--bor)', borderRadius: 10, overflow: 'hidden', marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderBottom: '1px solid var(--bor)', background: 'var(--sur)' }}>
        <span style={{ fontSize: '0.9rem' }}>{icon}</span>
        <span style={{ fontFamily: 'var(--mono)', fontSize: '0.62rem', letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--g3)' }}>{title}</span>
        <div style={{ marginLeft: 'auto', width: 24, height: 3, borderRadius: 2, background: accent }} />
      </div>
      <div style={{ padding: '12px 14px' }}>{children}</div>
    </div>
  );
}

interface ScoreRingProps { score: number; label: string; color?: string; }
function ScoreRing({ score, label, color = 'var(--green)' }: ScoreRingProps): JSX.Element {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const offset = circ - (circ * Math.min(score, 100) / 100);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <div style={{ position: 'relative', width: 72, height: 72 }}>
        <svg width="72" height="72" viewBox="0 0 72 72">
          <circle cx="36" cy="36" r={r} fill="none" stroke="var(--bor2)" strokeWidth="7" />
          <circle cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="7"
            strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
            style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }} />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontFamily: 'var(--serif)', fontSize: '1.2rem', color: 'var(--white)', lineHeight: 1 }}>{score}</span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: '0.5rem', color: 'var(--g3)' }}>/100</span>
        </div>
      </div>
      <span style={{ fontFamily: 'var(--mono)', fontSize: '0.6rem', color: 'var(--g3)', textAlign: 'center' }}>{label}</span>
    </div>
  );
}

// ─── API helpers ─────────────────────────────────────────────────────────────

type AnalysisType = 'extract' | 'match' | 'sentiment';

async function apiCall<T>(endpoint: string, body: Record<string, string>): Promise<T> {
  const res  = await fetch(`/api/analyse/${endpoint}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  });
  const json = await res.json() as { data?: T; error?: string };
  if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
  if (!json.data) throw new Error('Empty response from server');
  return json.data;
}

// ─── Result renderers ────────────────────────────────────────────────────────

function RenderExtract({ d, onImport }: { d: ExtractResult; onImport?: ((d: ExtractResult) => void) | undefined }): JSX.Element {
  const cs = d.completeness_score ?? 0;
  const csColor = cs >= 75 ? 'var(--green)' : cs >= 50 ? 'var(--amber)' : 'var(--red)';

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <Section title="Identity" icon="👤" accent="var(--blue2)">
          {([['Name', d.name], ['Email', d.email], ['Phone', d.phone], ['Location', d.location], ['Title', d.title]] as [string, string | null | undefined][]).map(([k, v]) =>
            v ? (
              <div key={k} style={{ display: 'flex', gap: 8, marginBottom: 5 }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: '0.6rem', color: 'var(--g3)', minWidth: 60, paddingTop: 2 }}>{k}</span>
                <span style={{ fontSize: '0.82rem', color: 'var(--g1)' }}>{v}</span>
              </div>
            ) : null,
          )}
        </Section>
        <Section title="Completeness" icon="📊" accent="var(--green)">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <ScoreRing score={cs} label="Profile Score" color={csColor} />
            {d.completeness_notes && <p style={{ fontSize: '0.74rem', color: 'var(--g3)', textAlign: 'center', lineHeight: 1.5 }}>{d.completeness_notes}</p>}
          </div>
        </Section>
      </div>

      {d.summary && (
        <Section title="AI Summary" icon="✨" accent="var(--purple)">
          <p style={{ fontSize: '0.84rem', color: 'var(--g2)', lineHeight: 1.7 }}>{d.summary}</p>
        </Section>
      )}

      {(d.skills?.length ?? 0) > 0 && (
        <Section title="Skills" icon="🛠" accent="var(--blue2)">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {d.skills!.map((s: string) => <Tag key={s} label={s} color="blue" />)}
          </div>
        </Section>
      )}

      {(d.experience?.length ?? 0) > 0 && (
        <Section title="Experience" icon="💼" accent="var(--green)">
          {d.experience!.map((ex: ExtractedExperience, i: number) => (
            <div key={i} style={{ marginBottom: i < d.experience!.length - 1 ? 14 : 0, paddingBottom: i < d.experience!.length - 1 ? 14 : 0, borderBottom: i < d.experience!.length - 1 ? '1px solid var(--bor)' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--g1)' }}>{ex.role}</span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: '0.6rem', color: 'var(--g3)' }}>{ex.duration}</span>
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--blue2)', marginBottom: 6 }}>{ex.company}</div>
              {ex.highlights.map((h: string, j: number) => (
                <div key={j} style={{ display: 'flex', gap: 8, fontSize: '0.78rem', color: 'var(--g2)', marginBottom: 3 }}>
                  <span style={{ color: 'var(--green)', flexShrink: 0 }}>▸</span>{h}
                </div>
              ))}
            </div>
          ))}
        </Section>
      )}

      {(d.education?.length ?? 0) > 0 && (
        <Section title="Education" icon="🎓" accent="var(--purple)">
          {d.education!.map((ed: ExtractedEducation, i: number) => (
            <div key={i} style={{ marginBottom: i < d.education!.length - 1 ? 10 : 0 }}>
              <span style={{ fontSize: '0.83rem', fontWeight: 600, color: 'var(--g1)' }}>{ed.degree}</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: '0.62rem', color: 'var(--g3)', marginLeft: 8 }}>{ed.year}</span>
              <div style={{ fontSize: '0.76rem', color: 'var(--g3)' }}>{ed.institution}</div>
            </div>
          ))}
        </Section>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {(d.strengths?.length ?? 0) > 0 && (
          <Section title="Strengths" icon="💪" accent="var(--green)">
            {d.strengths!.map((s: string, i: number) => (
              <div key={i} style={{ display: 'flex', gap: 8, fontSize: '0.78rem', color: 'var(--g2)', marginBottom: 4 }}>
                <span style={{ color: 'var(--green)' }}>✓</span>{s}
              </div>
            ))}
          </Section>
        )}
        {(d.red_flags?.length ?? 0) > 0 && (
          <Section title="Red Flags" icon="⚠️" accent="var(--red)">
            {d.red_flags!.map((f: string, i: number) => (
              <div key={i} style={{ display: 'flex', gap: 8, fontSize: '0.78rem', color: 'var(--g2)', marginBottom: 4 }}>
                <span style={{ color: 'var(--red)' }}>!</span>{f}
              </div>
            ))}
          </Section>
        )}
      </div>

      {onImport && d.name && (
        <button className="btn btn-primary" style={{ width: '100%', marginTop: 8, justifyContent: 'center' }} onClick={() => onImport(d)}>
          ＋ Import as Candidate
        </button>
      )}
    </>
  );
}

function RenderMatch({ d }: { d: MatchResult }): JSX.Element {
  const sc    = d.overall_score ?? 0;
  const color = sc >= 75 ? 'var(--green)' : sc >= 50 ? 'var(--amber)' : 'var(--red)';
  return (
    <>
      <div style={{ display: 'flex', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200, background: 'var(--sur)', border: '1px solid var(--bor)', borderRadius: 10, padding: '14px 16px', display: 'flex', gap: 16, alignItems: 'center' }}>
          <ScoreRing score={sc} label="Overall" color={color} />
          <div>
            <div style={{ fontFamily: 'var(--serif)', fontSize: '1.1rem', color: 'var(--white)', marginBottom: 4 }}>{d.recommendation}</div>
            <p style={{ fontSize: '0.78rem', color: 'var(--g3)', lineHeight: 1.6 }}>{d.summary}</p>
          </div>
        </div>
        {d.category_scores && (
          <div style={{ background: 'var(--sur)', border: '1px solid var(--bor)', borderRadius: 10, padding: '14px 16px', minWidth: 160 }}>
            {(Object.entries(d.category_scores) as [string, number][]).map(([k, v]) => (
              <div key={k} style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: '0.6rem', color: 'var(--g3)', textTransform: 'capitalize' }}>{k.replace('_', ' ')}</span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: '0.6rem', color: v >= 70 ? 'var(--green)' : v >= 45 ? 'var(--amber)' : 'var(--red)' }}>{v}</span>
                </div>
                <div style={{ height: 4, background: 'var(--bor)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${v}%`, background: v >= 70 ? 'var(--green)' : v >= 45 ? 'var(--amber)' : 'var(--red)', borderRadius: 2 }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        {(d.matched_skills?.length ?? 0) > 0 && (
          <Section title="Matched Skills" icon="✅" accent="var(--green)">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>{d.matched_skills!.map((s: string) => <Tag key={s} label={s} color="green" />)}</div>
          </Section>
        )}
        {(d.missing_skills?.length ?? 0) > 0 && (
          <Section title="Missing Skills" icon="❌" accent="var(--red)">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>{d.missing_skills!.map((s: string) => <Tag key={s} label={s} color="red" />)}</div>
          </Section>
        )}
      </div>

      {(d.bonus_skills?.length ?? 0) > 0 && (
        <Section title="Bonus Skills" icon="⭐" accent="var(--purple)">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>{d.bonus_skills!.map((s: string) => <Tag key={s} label={s} color="purple" />)}</div>
        </Section>
      )}

      {(d.interview_questions?.length ?? 0) > 0 && (
        <Section title="Suggested Interview Questions" icon="🎤" accent="var(--blue2)">
          {d.interview_questions!.map((q: string, i: number) => (
            <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8, padding: '8px 10px', background: 'var(--sur)', borderRadius: 7, border: '1px solid var(--bor)' }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: '0.6rem', color: 'var(--blue2)', fontWeight: 700, minWidth: 18 }}>Q{i + 1}</span>
              <span style={{ fontSize: '0.81rem', color: 'var(--g2)', lineHeight: 1.5 }}>{q}</span>
            </div>
          ))}
        </Section>
      )}

      {(d.risks?.length ?? 0) > 0 && (
        <Section title="Risks" icon="⚠️" accent="var(--amber)">
          {d.risks!.map((r: string, i: number) => (
            <div key={i} style={{ display: 'flex', gap: 8, fontSize: '0.78rem', color: 'var(--g2)', marginBottom: 4 }}>
              <span style={{ color: 'var(--amber)' }}>▲</span>{r}
            </div>
          ))}
        </Section>
      )}
    </>
  );
}

function RenderSentiment({ d }: { d: SentimentResult }): JSX.Element {
  return (
    <>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 14, padding: '14px 12px', background: 'var(--sur)', border: '1px solid var(--bor)', borderRadius: 10 }}>
        {([
          { label: 'Tone',          val: d.tone_score,            color: 'var(--blue2)'  },
          { label: 'Clarity',       val: d.clarity_score,         color: 'var(--green)'  },
          { label: 'Confidence',    val: d.confidence_score,      color: 'var(--purple)' },
          { label: 'Writing',       val: d.writing_quality_score, color: 'var(--amber)'  },
        ] as const).map(({ label, val, color }) => (
          <ScoreRing key={label} score={val ?? 0} label={label} color={color} />
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12, justifyContent: 'center' }}>
        <Tag label={`Tone: ${d.overall_tone ?? '—'}`} color="blue" />
        <Tag label={`Sentiment: ${d.sentiment ?? '—'}`} color={d.sentiment === 'Positive' ? 'green' : d.sentiment === 'Negative' ? 'red' : 'amber'} />
        <Tag label={`Readability: ${d.readability ?? '—'}`} color="purple" />
        {d.word_count && <Tag label={`${d.word_count} words`} color="amber" />}
      </div>

      {d.standout_sentence && (
        <Section title="Standout Sentence" icon="💬" accent="var(--purple)">
          <blockquote style={{ borderLeft: '3px solid var(--purple)', paddingLeft: 12, margin: 0, fontFamily: 'var(--serif)', fontSize: '1rem', fontStyle: 'italic', color: 'var(--g1)', lineHeight: 1.7 }}>
            &ldquo;{d.standout_sentence}&rdquo;
          </blockquote>
        </Section>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {(d.power_words?.length ?? 0) > 0 && (
          <Section title="Power Words" icon="⚡" accent="var(--green)">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>{d.power_words!.map((w: string) => <Tag key={w} label={w} color="green" />)}</div>
          </Section>
        )}
        {(d.weak_phrases?.length ?? 0) > 0 && (
          <Section title="Weak Phrases" icon="🔻" accent="var(--red)">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>{d.weak_phrases!.map((w: string) => <Tag key={w} label={w} color="red" />)}</div>
          </Section>
        )}
      </div>

      {(d.key_themes?.length ?? 0) > 0 && (
        <Section title="Key Themes" icon="🏷" accent="var(--blue2)">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{d.key_themes!.map((t: string) => <Tag key={t} label={t} color="blue" />)}</div>
        </Section>
      )}

      {(d.improvement_tips?.length ?? 0) > 0 && (
        <Section title="Improvement Tips" icon="💡" accent="var(--amber)">
          {d.improvement_tips!.map((tip: string, i: number) => (
            <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8, padding: '8px 10px', background: 'var(--sur)', borderRadius: 7, border: '1px solid var(--bor)' }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: '0.6rem', background: 'rgba(217,119,6,0.1)', color: 'var(--amber)', padding: '1px 6px', borderRadius: 4, height: 'fit-content', flexShrink: 0 }}>{i + 1}</span>
              <span style={{ fontSize: '0.81rem', color: 'var(--g2)', lineHeight: 1.5 }}>{tip}</span>
            </div>
          ))}
        </Section>
      )}
    </>
  );
}

// ─── Tab config ──────────────────────────────────────────────────────────────

interface TabConfig {
  id:    AnalysisType;
  label: string;
  icon:  string;
  model: string;
  desc:  string;
}

const TABS: TabConfig[] = [
  { id: 'extract',   label: 'CV Extraction', icon: '📄', model: 'Mistral-7B',                  desc: 'Parse any CV into structured data — name, skills, experience, education' },
  { id: 'match',     label: 'Job Match',      icon: '🎯', model: 'Mistral + MiniLM embeddings', desc: 'Score a candidate against a job description using semantic similarity' },
  { id: 'sentiment', label: 'Text Sentiment', icon: '🧠', model: 'RoBERTa + BART + Mistral',    desc: 'Analyse tone, writing quality and language patterns' },
];

const LOAD_MSGS: Record<AnalysisType, string[]> = {
  extract:   ['Sending to Mistral-7B…', 'Parsing CV structure…', 'Extracting entities…', 'Building profile…'],
  match:     ['Extracting skills with Mistral…', 'Generating embeddings (MiniLM)…', 'Computing cosine similarity…', 'Scoring match…'],
  sentiment: ['Running Cardiff RoBERTa…', 'Classifying themes (BART)…', 'Analysing writing (Mistral)…', 'Compiling report…'],
};

// ─── Main modal ──────────────────────────────────────────────────────────────

interface Props {
  onClose:            () => void;
  onImportCandidate?: (d: IR) => void;
}

export default function TextAnalysisModal({ onClose, onImportCandidate }: Props): JSX.Element {
  const [tab,      setTab]      = useState<AnalysisType>('extract');
  const [cvText,   setCvText]   = useState('');
  const [jobText,  setJobText]  = useState('');
  const [result,   setResult]   = useState<AnalysisResult | null>(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [loadMsg,  setLoadMsg]  = useState('');
  const fileRef = useRef<HTMLInputElement | null>(null);

  // ── Loading message cycle ────────────────────────────────────────────────
  const startLoad = (type: AnalysisType): ReturnType<typeof setInterval> => {
    setLoading(true); setResult(null); setError('');
    const msgs = LOAD_MSGS[type];
    let i = 0;
    setLoadMsg(msgs[0] ?? '');
    return setInterval(() => { i = (i + 1) % msgs.length; setLoadMsg(msgs[i] ?? ''); }, 1000);
  };

  // ── Run analysis ─────────────────────────────────────────────────────────
  const run = async (type: AnalysisType): Promise<void> => {
    if (!cvText.trim()) { setError('Please paste some text first.'); return; }
    if (type === 'match' && !jobText.trim()) { setError('Please enter a job description.'); return; }

    const iv = startLoad(type);
    try {
      let data: ExtractResult | MatchResult | SentimentResult;
      if (type === 'extract') {
        data = await apiCall<ExtractResult>('extract', { text: cvText });
      } else if (type === 'match') {
        data = await apiCall<MatchResult>('match', { cvText, jobText });
      } else {
        data = await apiCall<SentimentResult>('sentiment', { text: cvText });
      }
      clearInterval(iv);
      setResult({ type, data } as AnalysisResult);
    } catch (e) {
      clearInterval(iv);
      setError('Request failed — ' + (e instanceof Error ? e.message : String(e)) + '. Is the server running on :3001?');
    } finally {
      setLoading(false);
    }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev): void => {
      const text = ev.target?.result;
      if (typeof text === 'string') setCvText(text);
    };
    reader.readAsText(file);
  };

  const currentTab = TABS.find(t => t.id === tab)!;

  return (
    <div className="modal-back" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ width: 680, maxWidth: '96vw', maxHeight: '92vh' }}>

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="modal-hd" style={{ borderBottom: 'none', paddingBottom: 0 }}>
          <div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '0.6rem', letterSpacing: 2, textTransform: 'uppercase', color: 'var(--g3)', marginBottom: 4 }}>
              Hugging Face · Backend Powered
            </div>
            <span className="modal-title">Text Extraction &amp; Analysis</span>
          </div>
          <button className="modal-x" onClick={onClose}>✕</button>
        </div>

        {/* ── Mode tabs ──────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', padding: '0 20px', borderBottom: '1px solid var(--bor)' }}>
          {TABS.map(t => (
            <div key={t.id}
              style={{ padding: '10px 14px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 500, color: tab === t.id ? 'var(--blue2)' : 'var(--g3)', borderBottom: `2px solid ${tab === t.id ? 'var(--blue2)' : 'transparent'}`, transition: 'all 0.15s', marginBottom: -1, display: 'flex', alignItems: 'center', gap: 5 }}
              onClick={() => { setTab(t.id); setResult(null); setError(''); }}>
              <span style={{ fontSize: '0.85rem' }}>{t.icon}</span> {t.label}
            </div>
          ))}
        </div>

        <div style={{ padding: '16px 20px', overflowY: 'auto', maxHeight: 'calc(92vh - 145px)' }}>

          {/* ── Info bar ───────────────────────────────────────────────── */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
            <div style={{ background: 'var(--blue-dim)', border: '1px solid rgba(58,98,200,0.2)', borderRadius: 8, padding: '7px 12px', fontSize: '0.78rem', color: 'var(--blue2)', flex: 1 }}>
              {currentTab.icon} {currentTab.desc}
            </div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '0.6rem', color: 'var(--g3)', background: 'var(--bg3)', border: '1px solid var(--bor)', borderRadius: 6, padding: '4px 10px', whiteSpace: 'nowrap' }}>
              🤗 {currentTab.model}
            </div>
          </div>

          {/* ── Input textarea ─────────────────────────────────────────── */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
              <label style={{ fontFamily: 'var(--mono)', fontSize: '0.6rem', letterSpacing: 1, textTransform: 'uppercase', color: 'var(--g3)' }}>
                {tab === 'match' ? 'Candidate CV' : 'Input Text'}
              </label>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn btn-ghost btn-sm" style={{ fontSize: '0.68rem' }} onClick={() => fileRef.current?.click()}>📎 .txt</button>
                {cvText && <button className="btn btn-ghost btn-sm" style={{ fontSize: '0.68rem', color: 'var(--red)' }} onClick={() => { setCvText(''); setResult(null); }}>Clear</button>}
              </div>
            </div>
            <input ref={fileRef} type="file" accept=".txt,.md" style={{ display: 'none' }} onChange={handleFile} />
            <textarea
              style={{ width: '100%', background: 'var(--bg3)', border: '1px solid var(--bor2)', borderRadius: 8, padding: '10px 12px', fontFamily: 'var(--sans)', fontSize: '0.82rem', color: 'var(--g1)', outline: 'none', resize: 'vertical', minHeight: 120, lineHeight: 1.6 }}
              placeholder={tab === 'extract' ? 'Paste a CV, resume, or bio…' : tab === 'match' ? "Paste the candidate's CV…" : 'Paste any professional text…'}
              value={cvText}
              onChange={e => setCvText(e.target.value)}
            />
            <div style={{ fontFamily: 'var(--mono)', fontSize: '0.58rem', color: 'var(--g3)', marginTop: 3, textAlign: 'right' }}>
              {cvText.length.toLocaleString()} chars
            </div>
          </div>

          {/* ── Job description (match only) ───────────────────────────── */}
          {tab === 'match' && (
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontFamily: 'var(--mono)', fontSize: '0.6rem', letterSpacing: 1, textTransform: 'uppercase', color: 'var(--g3)', display: 'block', marginBottom: 5 }}>
                Job Description
              </label>
              <textarea
                style={{ width: '100%', background: 'var(--bg3)', border: '1px solid var(--bor2)', borderRadius: 8, padding: '10px 12px', fontFamily: 'var(--sans)', fontSize: '0.82rem', color: 'var(--g1)', outline: 'none', resize: 'vertical', minHeight: 90, lineHeight: 1.6 }}
                placeholder="Paste the job description and requirements…"
                value={jobText}
                onChange={e => setJobText(e.target.value)}
              />
            </div>
          )}

          {/* ── Error banner ───────────────────────────────────────────── */}
          {error && (
            <div style={{ background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 7, padding: '10px 12px', fontSize: '0.8rem', color: 'var(--red)', marginBottom: 12 }}>
              ⚠ {error}
            </div>
          )}

          {/* ── Run button ─────────────────────────────────────────────── */}
          {!loading && result === null && (
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '10px', marginBottom: 12 }}
              onClick={() => { void run(tab); }}>
              {tab === 'extract' ? '🔍 Extract & Analyse' : tab === 'match' ? '🎯 Run Match' : '🧠 Analyse Sentiment'}
            </button>
          )}

          {/* ── Loading spinner ────────────────────────────────────────── */}
          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '28px 20px' }}>
              <div style={{ position: 'relative', width: 48, height: 48 }}>
                <svg width="48" height="48" viewBox="0 0 48 48">
                  <circle cx="24" cy="24" r="20" fill="none" stroke="var(--bor2)" strokeWidth="4" />
                  <circle cx="24" cy="24" r="20" fill="none" stroke="var(--blue2)" strokeWidth="4"
                    strokeDasharray="125" strokeDashoffset="90" strokeLinecap="round"
                    style={{ transformOrigin: '50% 50%', animation: 'spin 1s linear infinite' }} />
                </svg>
              </div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '0.72rem', color: 'var(--g2)' }}>{loadMsg}</div>
            </div>
          )}

          {/* ── Results ────────────────────────────────────────────────── */}
          {result !== null && !loading && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)', display: 'inline-block' }} />
                  <span style={{ fontFamily: 'var(--mono)', fontSize: '0.62rem', color: 'var(--green)', letterSpacing: 1 }}>ANALYSIS COMPLETE</span>
                </div>
                <button className="btn btn-ghost btn-sm" style={{ fontSize: '0.68rem' }} onClick={() => setResult(null)}>↻ Re-run</button>
              </div>
              {result.type === 'extract'   && <RenderExtract   d={result.data as ExtractResult}   {...(onImportCandidate !== undefined && { onImport: onImportCandidate })} />}
              {result.type === 'match'     && <RenderMatch     d={result.data as MatchResult}     />}
              {result.type === 'sentiment' && <RenderSentiment d={result.data as SentimentResult} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
