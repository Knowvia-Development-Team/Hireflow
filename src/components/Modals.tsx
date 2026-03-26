import { IconX, IconLinkedIn, IconTwitter, IconFacebook, IconInstagram, IconImage } from '@/shared/components/ui/Icons';
import { useState, useRef } from 'react';
import type { ReactNode } from 'react';
import type { Candidate, NewJobFormData, NewCandidateFormData, NewInterviewFormData } from '@/types';
import { EMAIL_TEMPLATES } from '@/data';

// ── Shared shell ─────────────────────────────────────────────────────────────

interface ShellProps {
  title:    string;
  onClose:  () => void;
  children: ReactNode;
  footer:   ReactNode;
}

function ModalShell({ title, onClose, children, footer }: ShellProps): JSX.Element {
  return (
    <div className="modal-back" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="modal-hd">
          <span className="modal-title">{title}</span>
          <button className="modal-x" onClick={onClose} aria-label="Close dialog"><IconX size={13} /></button>
        </div>
        <div className="modal-body">{children}</div>
        <div className="modal-foot">{footer}</div>
      </div>
    </div>
  );
}

// ── New Job ──────────────────────────────────────────────────────────────────

interface NewJobProps { onClose: () => void; onSubmit: (f: NewJobFormData) => void; }

export function NewJobModal({ onClose, onSubmit }: NewJobProps): JSX.Element {
  const [form, setForm] = useState<NewJobFormData>({ 
    title: '', dept: 'Design', type: 'Full-time', location: 'Remote', desc: '', skills: '', 
    socialMedia: [], flyer: null 
  });
  const [flyerFile, setFlyerFile] = useState<File | null>(null);
  const flyerInputRef = useRef<HTMLInputElement>(null);

  const set = (k: keyof NewJobFormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  const toggleSocialMedia = (platform: string) => {
    setForm(p => {
      const current = p.socialMedia || [];
      const updated = current.includes(platform) 
        ? current.filter((s: string) => s !== platform)
        : [...current, platform];
      return { ...p, socialMedia: updated };
    });
  };

  const handleFlyerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFlyerFile(file);
      setForm(p => ({ ...p, flyer: file }));
    }
  };

  const removeFlyer = () => {
    setFlyerFile(null);
    setForm(p => ({ ...p, flyer: null }));
    if (flyerInputRef.current) flyerInputRef.current.value = '';
  };

  return (
    <ModalShell title="Post a new Job" onClose={onClose}
      footer={<><button className="btn btn-ghost" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={() => { onSubmit(form); onClose(); }}>Post Job →</button></>}>
      <div className="form-row">
        <div className="form-field"><label className="form-label">Job Title *</label><input className="form-input" placeholder="e.g. Senior Product Designer" value={form.title} onChange={set('title')} /></div>
        <div className="form-field"><label className="form-label">Department</label><select className="form-select" value={form.dept} onChange={set('dept')}><option>Design</option><option>Engineering</option><option>Marketing</option><option>Data</option><option>Finance</option><option>Product</option></select></div>
      </div>
      <div className="form-row">
        <div className="form-field"><label className="form-label">Location Type</label><select className="form-select" value={form.location} onChange={set('location')}><option>Remote</option><option>Hybrid</option><option>On-site</option></select></div>
        <div className="form-field"><label className="form-label">Employment Type</label><select className="form-select" value={form.type} onChange={set('type')}><option>Full-time</option><option>Part-time</option><option>Contract</option></select></div>
      </div>
      <div className="form-field"><label className="form-label">Job Description</label><textarea className="form-input" rows={3} placeholder="Describe the role…" value={form.desc} onChange={set('desc')} /></div>
      <div className="form-field">
        <label className="form-label">Required Skills <span style={{ fontFamily: 'var(--mono)', fontSize: '0.56rem', color: 'var(--blue2)' }}>used by AI scorer</span></label>
        <input className="form-input" placeholder="e.g. Figma, Design Systems, Prototyping" value={form.skills} onChange={set('skills')} />
      </div>
      <div style={{ background: 'var(--blue-dim)', border: '1px solid rgba(58,98,200,0.2)', borderRadius: 7, padding: '10px 14px', fontSize: '0.78rem', color: 'var(--blue2)' }}>
        After posting, the AI Service will index required skills for automatic CV scoring.
      </div>
      
      {/* Social Media Posting */}
      <div className="form-field">
        <label className="form-label">Post to Social Media</label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
          {['LinkedIn', 'Twitter', 'Facebook', 'Instagram'].map(platform => (
            <button
              key={platform}
              type="button"
              className={`btn btn-sm ${(form.socialMedia || []).includes(platform) ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => toggleSocialMedia(platform)}
              style={{ border: (form.socialMedia || []).includes(platform) ? '1px solid var(--blue)' : '1px solid var(--bor)', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              {platform === 'LinkedIn' && <IconLinkedIn size={14} />}
              {platform === 'Twitter' && <IconTwitter size={14} />}
              {platform === 'Facebook' && <IconFacebook size={14} />}
              {platform === 'Instagram' && <IconInstagram size={14} />}
              {platform}
            </button>
          ))}
        </div>
        <div style={{ fontSize: '0.7rem', color: 'var(--g3)', marginTop: 4 }}>Select platforms to share this job posting</div>
      </div>

      {/* Flyer Upload */}
      <div className="form-field">
        <label className="form-label">Attach Job Flyer (Optional)</label>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => flyerInputRef.current?.click()} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <IconImage size={14} />
            {flyerFile ? flyerFile.name : 'Upload Flyer'}
          </button>
          {flyerFile && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={removeFlyer} style={{ color: 'var(--red)' }}>✕</button>
          )}
        </div>
        <input
          ref={flyerInputRef}
          type="file"
          accept=".png,.jpg,.jpeg,.pdf"
          onChange={handleFlyerChange}
          style={{ display: 'none' }}
        />
        <div style={{ fontSize: '0.7rem', color: 'var(--g3)', marginTop: 4 }}>PNG, JPG, PDF (max 10MB)</div>
      </div>
    </ModalShell>
  );
}

// ── Add Candidate ────────────────────────────────────────────────────────────

interface AddCandProps { onClose: () => void; onSubmit: (f: NewCandidateFormData) => void; }

export function AddCandidateModal({ onClose, onSubmit }: AddCandProps): JSX.Element {
  const [form, setForm] = useState<NewCandidateFormData>({ fname: '', lname: '', email: '', source: 'LinkedIn' });
  const [cvFile, setCvFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const set = (k: keyof NewCandidateFormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setCvFile(file);
  };

  const handleSubmit = () => {
    // In a real app, upload CV file here
    if (cvFile) console.log('CV file to upload:', cvFile.name);
    onSubmit(form);
    onClose();
  };

  return (
    <ModalShell title="Add Candidate" onClose={onClose}
      footer={<><button className="btn btn-ghost" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={handleSubmit}>Add Candidate →</button></>}>
      <div className="form-row">
        <div className="form-field"><label className="form-label">First Name</label><input className="form-input" placeholder="First name" value={form.fname} onChange={set('fname')} /></div>
        <div className="form-field"><label className="form-label">Last Name</label><input className="form-input" placeholder="Last name" value={form.lname} onChange={set('lname')} /></div>
      </div>
      <div className="form-field"><label className="form-label">Email</label><input className="form-input" type="email" placeholder="candidate@email.com" value={form.email} onChange={set('email')} /></div>
      <div className="form-field"><label className="form-label">Source</label>
        <select className="form-select" value={form.source} onChange={set('source')}>
          <option>LinkedIn</option><option>Referral</option><option>Job Board</option><option>Direct</option>
        </select>
      </div>
      <div className="form-field">
        <label className="form-label">Attach CV (Optional)</label>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => fileInputRef.current?.click()}>
            {cvFile ? '📎 ' + cvFile.name : '📁 Upload CV'}
          </button>
          {cvFile && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setCvFile(null)} style={{ color: 'var(--red)' }}>✕</button>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        <div style={{ fontSize: '0.7rem', color: 'var(--g3)', marginTop: 4 }}>PDF, DOC, DOCX (max 10MB)</div>
      </div>
    </ModalShell>
  );
}

// ── Schedule Interview ───────────────────────────────────────────────────────

interface SchedProps { onClose: () => void; onSubmit: (f: NewInterviewFormData) => void; candidates: Candidate[]; }

export function ScheduleModal({ onClose, onSubmit, candidates }: SchedProps): JSX.Element {
  const [form, setForm] = useState<NewInterviewFormData>({
    candidate: candidates[0]?.name ?? '',
    type: 'Screening', date: '2026-03-22', time: '10:00',
    duration: 60, interviewers: 'Tino Dube', notes: '',
  });
  const set = (k: keyof NewInterviewFormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  return (
    <ModalShell title="Schedule Interview" onClose={onClose}
      footer={<><button className="btn btn-ghost" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={() => { onSubmit(form); onClose(); }}>Schedule →</button></>}>
      <div className="form-field"><label className="form-label">Candidate</label>
        <select className="form-select" value={form.candidate} onChange={set('candidate')}>
          {candidates.map(c => <option key={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div className="form-row">
        <div className="form-field"><label className="form-label">Type</label>
          <select className="form-select" value={form.type} onChange={set('type')}>
            <option>Screening</option><option>Technical</option><option>Final</option><option>Culture</option>
          </select>
        </div>
        <div className="form-field"><label className="form-label">Duration</label>
          <select className="form-select" value={form.duration} onChange={set('duration')}>
            <option value={30}>30 min</option><option value={60}>60 min</option><option value={90}>90 min</option>
          </select>
        </div>
      </div>
      <div className="form-row">
        <div className="form-field"><label className="form-label">Date</label><input className="form-input" type="date" value={form.date} onChange={set('date')} /></div>
        <div className="form-field"><label className="form-label">Time</label><input className="form-input" type="time" value={form.time} onChange={set('time')} /></div>
      </div>
      <div className="form-field"><label className="form-label">Interviewers</label><input className="form-input" placeholder="Tino Dube, Sarah Moyo" value={form.interviewers} onChange={set('interviewers')} /></div>
      <div className="form-field"><label className="form-label">Notes</label><input className="form-input" placeholder="Any prep notes…" value={form.notes} onChange={set('notes')} /></div>
    </ModalShell>
  );
}

// ── Compose Email ─────────────────────────────────────────────────────────────

export interface ComposeEmailData {
  to: string;
  subject: string;
  body: string;
  template: string;
}

interface ComposeEmailProps {
  onClose: () => void;
  onSubmit: (f: ComposeEmailData) => void;
}

export function ComposeEmailModal({ onClose, onSubmit }: ComposeEmailProps): JSX.Element {
  const [form, setForm] = useState<ComposeEmailData>({
    to: '',
    subject: '',
    body: '',
    template: 'Reply',
  });

  const set = (k: keyof ComposeEmailData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  const handleTemplateChange = (template: string) => {
    setForm(p => ({ ...p, template, body: EMAIL_TEMPLATES[template] ?? '' }));
  };

  const handleSubmit = () => {
    if (!form.to.trim() || !form.subject.trim()) return;
    onSubmit(form);
    onClose();
  };

  return (
    <ModalShell title="Compose Email" onClose={onClose}
      footer={<><button className="btn btn-ghost" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={handleSubmit} disabled={!form.to.trim() || !form.subject.trim()}>Send →</button></>}>
      <div className="form-field">
        <label className="form-label">To (Recipient Email) *</label>
        <input className="form-input" type="email" placeholder="candidate@email.com" value={form.to} onChange={set('to')} />
      </div>
      <div className="form-field">
        <label className="form-label">Subject *</label>
        <input className="form-input" placeholder="Email subject" value={form.subject} onChange={set('subject')} />
      </div>
      <div className="form-field">
        <label className="form-label">Template</label>
        <select className="form-select" value={form.template} onChange={e => handleTemplateChange(e.target.value)}>
          {Object.keys(EMAIL_TEMPLATES).map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>
      <div className="form-field">
        <label className="form-label">Message</label>
        <textarea className="form-input" rows={6} placeholder="Write your email message…" value={form.body} onChange={set('body')} />
      </div>
    </ModalShell>
  );
}
