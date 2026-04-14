import { useState } from 'react';
import { triggerCVPipeline } from '@/features/pipeline/services/cvPipeline';
import { IconCpu, IconCheck, IconAlertTriangle, IconPaperclip, IconLoader, IconArrowRight } from '@/shared/components/ui/Icons';
import { parseOrThrow } from '@/shared/lib/validators';
import { PortalApplicationSchema } from '@/shared/lib/validators';
import { logger } from '@/shared/lib/logger';
import type { Job, PortalFormData, Candidate, CVUploadEvent } from '@/types';

interface Props {
  job:      Job;
  onClose:  () => void;
  onSubmit: (form: PortalFormData, job: Job) => void;
  /** Called when the automated pipeline produces a candidate record */
  onPipelineComplete?: (candidate: Candidate) => void;
}

const EMPTY: PortalFormData = {
  fname:'', lname:'', email:'', phone:'', location:'',
  linkedin:'', portfolio:'', cover:'', source:'',
};
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function ApplicationPortal({ job, onClose, onSubmit, onPipelineComplete }: Props): JSX.Element {
  const [form,       setForm]       = useState<PortalFormData>(EMPTY);
  const [submitted,  setSubmitted]  = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState('');
  const [cvText,     setCvText]     = useState('');
  const [cvUrl,      setCvUrl]      = useState<string | null>(null);
  const [cvFilename, setCvFilename] = useState<string | null>(null);
  const [cvFileName, setCvFileName] = useState('');
  const [cvFile,     setCvFile]     = useState<File | null>(null);
  const [cvUploadMsg, setCvUploadMsg] = useState('');
  const [cvUploading, setCvUploading] = useState(false);
  const [pipelineMsg,setPipelineMsg]= useState('');
  const isOpen = job.status === 'Open';

  const set = (k: keyof PortalFormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>): void =>
      setForm(p => ({ ...p, [k]: e.target.value }));

  const handleFileUpload = async (file: File): Promise<void> => {
    setCvUploading(true);
    setCvUploadMsg('');
    try {
      const body = new FormData();
      body.append('cv', file);
      const res = await fetch(`${API_URL}/api/applications/cv-text`, { method: 'POST', body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to read CV');
      setCvFileName(file.name);
      setCvFile(file);
      setCvText(data.text || '');
      setCvUrl(data.cv_url ?? null);
      setCvFilename(data.cv_filename ?? file.name);
      if ((data.warnings ?? []).length > 0) {
        setCvUploadMsg(data.warnings[0]);
      }
    } catch (e) {
      setCvUploadMsg(e instanceof Error ? e.message : 'CV upload failed');
    } finally {
      setCvUploading(false);
    }
  };

  const persistApplication = async (): Promise<void> => {
    const body = new FormData();
    body.append('job_id', job.id);
    body.append('full_name', `${form.fname} ${form.lname}`.trim());
    body.append('email', form.email);
    if (form.phone) body.append('phone', form.phone);
    if (form.linkedin) body.append('linkedin_url', form.linkedin);
    if (form.cover) body.append('cover_letter', form.cover);
    if (form.source) body.append('source', form.source);
    if (cvFile) {
      body.append('cv', cvFile);
    } else if (cvText) {
      body.append('cv_text', cvText);
      if (cvUrl) body.append('cv_url', cvUrl);
      if (cvFilename) body.append('cv_filename', cvFilename);
    }

    const res = await fetch(`${API_URL}/api/applications`, { method: 'POST', body });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || 'Failed to submit application');
    }
  };

  const handleSubmit = (): void => {
    if (!isOpen) {
      setError('Applications for this role are currently paused.');
      return;
    }
    try {
      parseOrThrow(PortalApplicationSchema, form);
    } catch (e) {
      setError(e instanceof Error ? e.message.replace('Validation failed: ', '') : 'Please check your inputs.');
      return;
    }
    setError('');
    setSubmitting(true);

    setTimeout(() => {
      void (async () => {
        try {
          await persistApplication();
        } catch (e) {
          setSubmitting(false);
          setError(e instanceof Error ? e.message : 'Failed to submit application');
          return;
        }

        setSubmitting(false);
        setSubmitted(true);

        // Step 1: Notify parent (UI sync)
        onSubmit({ ...form, cvText, cvUrl, cvFilename }, job);

        // Step 2: Trigger automated CV analysis pipeline
        const candidateId = `${form.fname} ${form.lname}`.trim();
        const event: CVUploadEvent = {
          candidateId,
          jobId:      job.id,
          fileKey:    `cv-${Date.now()}.txt`,
          fileName:   `${candidateId.replace(/\s+/g,'-')}-cv.txt`,
          uploadedAt: new Date().toISOString(),
          email:      form.email,
          source:     form.source || 'Direct',
        };

        const analysisText = [
          `Candidate: ${candidateId}`,
          `Email: ${form.email}`,
          `Phone: ${form.phone ?? ''}`,
          `Location: ${form.location ?? ''}`,
          `LinkedIn: ${form.linkedin ?? ''}`,
          cvText ? `CV Content:\n${cvText}` : '',
          form.cover ? `Cover Note:\n${form.cover}` : '',
        ].filter(Boolean).join('\n\n');

        setPipelineMsg('Analysing your CV automatically...');

        triggerCVPipeline(event, analysisText, job, (candidate) => {
          logger.info('[Portal] Pipeline produced candidate', { id: candidate.id, score: candidate.score });
          setPipelineMsg(`Analysis complete — score ${candidate.score}/100`);
          onPipelineComplete?.(candidate);
        });
      })();
    }, 1500);
  };

  return (
    <div className="portal-overlay">
      <div className="portal-wrap">
        <div className="portal-brand"><span className="h">Hire</span><span className="f">Flow</span></div>

        <div className="portal-job-banner">
          <div className="portal-job-title">{job.title}</div>
          <div className="portal-job-meta">
            {[job.dept, job.location, job.type].map(t => <span key={t} className="portal-job-tag">{t}</span>)}
          </div>
          <div className="portal-job-desc">{job.desc}</div>
        </div>

        {submitted ? (
          <div className="portal-success">
            <div className="portal-success-icon"><IconCheck size={28} /></div>
            <div className="portal-success-title">Application submitted!</div>
            <div className="portal-success-sub">
              Thank you, <strong>{form.fname} {form.lname}</strong>. You're now in our pipeline.
              {pipelineMsg && (
                <div style={{ marginTop:12, fontSize:'0.78rem', color:'var(--g3)', fontFamily:'var(--mono)', display:'flex', alignItems:'center', gap:6 }}>
                  <IconCpu size={11} style={{ color:'var(--blue2)' }} />{pipelineMsg}
                </div>
              )}
            </div>
            <button className="btn btn-ghost" style={{ marginTop:24 }} onClick={onClose}>← Back to HireFlow</button>
          </div>
        ) : (
          <>
            {!isOpen && (
              <div style={{ background:'rgba(234,179,8,0.1)', border:'1px solid rgba(234,179,8,0.3)', borderRadius:7, padding:'10px 12px', fontSize:'0.8rem', color:'var(--amber)', marginBottom:12 }}>
                <IconAlertTriangle size={13} style={{ flexShrink:0 }} /> Applications are paused for this role. Please check back later.
              </div>
            )}
            {error && (
              <div style={{ background:'rgba(220,38,38,0.06)', border:'1px solid rgba(220,38,38,0.2)', borderRadius:7, padding:'10px 12px', fontSize:'0.8rem', color:'var(--red)', marginBottom:12 }}>
                <IconAlertTriangle size={13} style={{ flexShrink:0 }} /> {error}
              </div>
            )}

            <div className="portal-section-title">Your Details</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
              <div className="portal-field"><label className="portal-label">First Name *</label><input className="portal-input" placeholder="First name" value={form.fname} onChange={set('fname')} /></div>
              <div className="portal-field"><label className="portal-label">Last Name *</label><input className="portal-input" placeholder="Last name"  value={form.lname} onChange={set('lname')} /></div>
            </div>
            <div className="portal-field"><label className="portal-label">Email *</label><input className="portal-input" type="email" placeholder="you@email.com" value={form.email} onChange={set('email')} /></div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
              <div className="portal-field"><label className="portal-label">Phone</label><input className="portal-input" placeholder="+263 77…" value={form.phone} onChange={set('phone')} /></div>
              <div className="portal-field"><label className="portal-label">Location</label><input className="portal-input" placeholder="Harare, Zimbabwe" value={form.location} onChange={set('location')} /></div>
            </div>
            <div className="portal-field"><label className="portal-label">LinkedIn URL</label><input className="portal-input" placeholder="linkedin.com/in/…" value={form.linkedin} onChange={set('linkedin')} /></div>
            <div className="portal-field"><label className="portal-label">Portfolio / Website</label><input className="portal-input" placeholder="yoursite.com" value={form.portfolio} onChange={set('portfolio')} /></div>

            <div className="portal-section-title" style={{ marginTop:20 }}>CV / Resume</div>
            <div className="portal-field">
              <label className="portal-label">Paste your CV text (for instant AI analysis)</label>
              <label className="portal-cv-drop" style={{ marginBottom: 10 }}>
                <div className="portal-cv-icon"><IconPaperclip size={20} /></div>
                <div className="portal-cv-text">
                  {cvUploading ? 'Reading CV…' : (cvFileName || 'Upload PDF, DOC or DOCX')}
                </div>
                <div className="portal-cv-sub">We’ll extract text automatically</div>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                  onChange={e => {
                    const file = e.currentTarget.files?.[0];
                    if (file) void handleFileUpload(file);
                  }}
                />
              </label>
              <textarea
                className="portal-input portal-textarea"
                rows={6}
                placeholder="Paste your CV or resume text here — the system will automatically analyse and score it…"
                value={cvText}
                onChange={e => setCvText(e.target.value)}
              />
              <p style={{ fontSize:'0.7rem', color:'var(--g3)', marginTop:4 }}>
                <IconPaperclip size={11} style={{ flexShrink:0 }} /> CV text is automatically processed by our AI pipeline once you submit.
              </p>
              {cvUploadMsg && (
                <p style={{ fontSize:'0.7rem', color:'var(--amber)', marginTop:4 }}>{cvUploadMsg}</p>
              )}
            </div>

            <div className="portal-section-title" style={{ marginTop:20 }}>Cover Note</div>
            <div className="portal-field">
              <label className="portal-label">Why are you a great fit?</label>
              <textarea className="portal-input portal-textarea" rows={4} placeholder="Tell us about yourself…" value={form.cover} onChange={set('cover')} />
            </div>
            <div className="portal-field">
              <label className="portal-label">How did you hear about us?</label>
              <select className="portal-input" value={form.source} onChange={set('source')}>
                <option value="">Select…</option>
                {['LinkedIn','Referral','Job Board','Company Website','Other'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <button className="portal-submit" disabled={submitting || !isOpen} onClick={handleSubmit}>
              {submitting
                ? <span style={{display:'flex',alignItems:'center',gap:6}}><IconLoader size={13}/> Submitting…</span>
                : <span style={{display:'flex',alignItems:'center',gap:6}}><IconArrowRight size={13}/> Submit Application</span>}
            </button>
            <p style={{ fontSize:'0.72rem', color:'var(--g3)', textAlign:'center', marginTop:14, lineHeight:1.6 }}>
              Your application is automatically analysed — no manual review required on your end.
            </p>
            <div style={{ textAlign:'center', marginTop:16 }}>
              <button className="btn btn-ghost btn-sm" onClick={onClose}>← Back</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
