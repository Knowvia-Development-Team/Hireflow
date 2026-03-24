import {
  IconMapPin, IconDollar, IconEdit, IconClipboard, IconCheckSquare,
  IconTarget, IconTool, IconSave, IconLink, IconLoader, IconArrowRight,
} from '@/shared/components/ui/Icons';
import { useState, useCallback } from 'react';
import type { Job, ModalId, ToastColor } from '@/types';
import { fieldErrors, NewJobSchema } from '@/shared/lib/validators';

type JobView = 'list' | 'detail' | 'edit';

interface Props {
  jobs:       Job[];
  openModal:  (id: ModalId) => void;
  setJobs:    React.Dispatch<React.SetStateAction<Job[]>>;
  showToast:  (title: string, msg: string, color?: ToastColor) => void;
  openPortal: (job: Job) => void;
}

// ── Job Detail / Edit Panel ───────────────────────────────────────────────────

function JobDetail({ job, onEdit, onBack }: { job: Job; onEdit: () => void; onBack: () => void }): JSX.Element {
  const badgeStyle = {
    Open:   'pill-open', Draft: 'pill-draft',
    Paused: 'pill-closed', Closed: 'pill-red',
  }[job.status] ?? 'pill-blue';

  return (
    <div className="job-detail">
      <div className="pg-tag clickable" onClick={onBack} style={{ cursor:'pointer' }}>← Back to Jobs Board</div>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 className="pg-title" style={{ marginBottom:6 }}>{job.title}</h1>
          <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
            <span className="dept-tag">{job.dept}</span>
            <span className={`pill ${badgeStyle}`}><span className="pill-dot"/>{job.status}</span>
            <span style={{ fontFamily:'var(--mono)', fontSize:'0.7rem', color:'var(--g3)' }}>{job.type}</span>
            <span style={{ fontFamily:'var(--mono)', fontSize:'0.7rem', color:'var(--g3)' }}><IconMapPin size={11} style={{flexShrink:0}} /> {job.location}</span>
            {job.salary && <span style={{ fontFamily:'var(--mono)', fontSize:'0.7rem', color:'var(--green)' }}><IconDollar size={11} style={{flexShrink:0}} /> {job.salary}</span>}
          </div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={onEdit}><span style={{display:"flex",alignItems:"center",gap:6}}><IconEdit size={13} /> Edit Job</span></button>
      </div>

      <div className="two-col" style={{ gap:16 }}>
        <div>
          <Section title="Job Description" icon={<IconClipboard size={13} />}>
            <p style={{ fontSize:'0.86rem', color:'var(--g2)', lineHeight:1.8 }}>
              {job.desc || 'No description provided.'}
            </p>
          </Section>
          {job.responsibilities && (
            <Section title="Responsibilities" icon={<IconCheckSquare size={13} />}>
              {job.responsibilities.split('\n').filter(Boolean).map((r,i) => (
                <div key={i} style={{ display:'flex', gap:8, marginBottom:6 }}>
                  <span style={{ color:'var(--green)', fontSize:'0.8rem' }}><IconArrowRight size={10} /></span>
                  <span style={{ fontSize:'0.84rem', color:'var(--g2)' }}>{r}</span>
                </div>
              ))}
            </Section>
          )}
        </div>
        <div>
          {job.requirements && (
            <Section title="Requirements" icon={<IconTarget size={13} />}>
              {job.requirements.split('\n').filter(Boolean).map((r,i) => (
                <div key={i} style={{ display:'flex', gap:8, marginBottom:6 }}>
                  <span style={{ color:'var(--blue2)', fontSize:'0.8rem' }}>•</span>
                  <span style={{ fontSize:'0.84rem', color:'var(--g2)' }}>{r}</span>
                </div>
              ))}
            </Section>
          )}
          <Section title="Required Skills" icon={<IconTool size={13} />}>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              {job.skills.split(',').map(s => s.trim()).filter(Boolean).map(s => (
                <span key={s} style={{
                  fontFamily:'var(--mono)', fontSize:'0.65rem', padding:'3px 9px',
                  background:'var(--blue-dim)', border:'1px solid rgba(58,98,200,0.25)',
                  color:'var(--blue2)', borderRadius:6,
                }}>{s}</span>
              ))}
            </div>
          </Section>
          <div className="card" style={{ padding:16, marginTop:12 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              {([
                ['Experience Level', job.experienceLevel ?? 'Not specified'],
                ['Posted',           job.created],
                ['Applicants',       String(job.applicants)],
                ['Version',          `v${job.version ?? 1}`],
              ] as [string,string][]).map(([k,v]) => (
                <div key={k}>
                  <div style={{ fontFamily:'var(--mono)', fontSize:'0.58rem', letterSpacing:1, textTransform:'uppercase', color:'var(--g3)', marginBottom:3 }}>{k}</div>
                  <div style={{ fontSize:'0.84rem', color:'var(--g1)', fontWeight:500 }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, icon, children }: { title:string; icon:React.ReactNode; children:React.ReactNode }): JSX.Element {
  return (
    <div className="card" style={{ padding:16, marginBottom:12 }}>
      <div style={{ fontFamily:'var(--mono)', fontSize:'0.6rem', letterSpacing:1.5, textTransform:'uppercase', color:'var(--g3)', marginBottom:10, display:'flex', gap:6, alignItems:'center' }}>
        <span style={{display:"flex",alignItems:"center"}}>{icon}</span>{title}
      </div>
      {children}
    </div>
  );
}

// ── Job Edit Form ─────────────────────────────────────────────────────────────

type ExperienceLevel = 'Entry' | 'Mid' | 'Senior' | 'Lead' | 'Director';

type EditForm = {
  title: string; dept: string; location: string; salary: string;
  skills: string; desc: string; requirements: string;
  responsibilities: string; experienceLevel: ExperienceLevel; status: string;
};

function JobEditForm({ job, onSave, onCancel }: {
  job: Job;
  onSave: (updates: Partial<Job>) => void;
  onCancel: () => void;
}): JSX.Element {
  const [form, setForm] = useState<EditForm>({
    title:           job.title,
    dept:            job.dept,
    location:        job.location,
    salary:          job.salary,
    skills:          job.skills,
    desc:            job.desc,
    requirements:    job.requirements ?? '',
    responsibilities: job.responsibilities ?? '',
    experienceLevel: (job.experienceLevel ?? 'Mid') as ExperienceLevel,
    status:          job.status,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const set = (k: keyof EditForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSave = useCallback((): void => {
    const errs = fieldErrors(NewJobSchema, { ...form, type: job.type });
    setErrors(errs as Record<string,string>);
    if (Object.keys(errs).length > 0) return;
    setSaving(true);
    // Simulate PUT /jobs/{id} round-trip
    setTimeout(() => {
      onSave({
        ...form,
        experienceLevel: form.experienceLevel,
        status:          form.status as Job['status'],
        version:         (job.version ?? 1) + 1,
        updatedAt:       new Date().toISOString(),
      });
      setSaving(false);
    }, 600);
  }, [form, job, onSave]);

  const field = (label: string, key: keyof EditForm, type: 'input' | 'textarea' = 'input', rows = 3): JSX.Element => (
    <div className="form-field" style={{ marginBottom:14 }}>
      <label className="form-label" htmlFor={`edit-${key}`}>{label}</label>
      {type === 'textarea'
        ? <textarea id={`edit-${key}`} className="form-input" rows={rows} value={form[key]} onChange={set(key)} />
        : <input   id={`edit-${key}`} className="form-input" value={form[key]} onChange={set(key)} />
      }
      {errors[key] && <p role="alert" style={{ fontSize:'0.72rem', color:'var(--red)', marginTop:3 }}>{errors[key]}</p>}
    </div>
  );

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
        <h2 style={{ fontFamily:'var(--serif)', fontSize:'1.3rem', color:'var(--white)' }}>Edit: {job.title}</h2>
        <div style={{ display:'flex', gap:8 }}>
          <button className="btn btn-ghost btn-sm" onClick={onCancel}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={handleSave} aria-busy={saving}>
            {saving ? <span style={{display:"flex",alignItems:"center",gap:6}}><IconLoader size={13} /> Saving…</span> : <span style={{display:"flex",alignItems:"center",gap:6}}><IconSave size={13} /> Save Changes</span>}
          </button>
        </div>
      </div>

      <div className="two-col" style={{ gap:16 }}>
        <div>
          {field('Job Title *', 'title')}
          {field('Department *', 'dept')}
          {field('Location *', 'location')}
          {field('Salary Range', 'salary')}
          {field('Required Skills (comma-separated)', 'skills')}
          <div className="form-field" style={{ marginBottom:14 }}>
            <label className="form-label" htmlFor="edit-expLevel">Experience Level</label>
            <select id="edit-expLevel" className="form-input" value={form.experienceLevel} onChange={e => setForm(p => ({ ...p, experienceLevel: e.target.value as ExperienceLevel }))}>
              {(['Entry','Mid','Senior','Lead','Director'] as ExperienceLevel[]).map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div className="form-field" style={{ marginBottom:14 }}>
            <label className="form-label" htmlFor="edit-status">Status</label>
            <select id="edit-status" className="form-input" value={form.status} onChange={set('status')}>
              {['Open','Draft','Paused','Closed'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div>
          {field('Job Description *', 'desc', 'textarea', 5)}
          {field('Requirements (one per line)', 'requirements', 'textarea', 5)}
          {field('Responsibilities (one per line)', 'responsibilities', 'textarea', 5)}
        </div>
      </div>
    </div>
  );
}

// ── Main Jobs component ───────────────────────────────────────────────────────

export default function Jobs({ jobs, openModal, setJobs, showToast, openPortal }: Props): JSX.Element {
  const [panel,       setPanel]       = useState<JobView>('list');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  const openJob = useCallback((job: Job) => {
    setSelectedJob(job);
    setPanel('detail');
  }, []);

  const publishJob = useCallback((id: string): void => {
    setJobs(prev => prev.map(j => j.id === id ? { ...j, status: 'Open' } : j));
    showToast('Job Published', 'Job is now live.', 'green');
  }, [setJobs, showToast]);

  const saveJob = useCallback((updates: Partial<Job>): void => {
    if (!selectedJob) return;
    setJobs(prev => prev.map(j =>
      j.id === selectedJob.id ? { ...j, ...updates } : j
    ));
    setSelectedJob(prev => prev ? { ...prev, ...updates } : prev);
    setPanel('detail');
    showToast('Job Updated', `v${updates.version} saved successfully.`, 'green');
  }, [selectedJob, setJobs, showToast]);

  const openJobs = jobs.filter(j => j.status === 'Open').length;
  const depts    = new Set(jobs.map(j => j.dept)).size;

  // ── Detail / Edit views ──────────────────────────────────────────────────
  if (panel === 'detail' && selectedJob) {
    return (
      <div className="view">
        <JobDetail
          job={selectedJob}
          onEdit={() => setPanel('edit')}
          onBack={() => setPanel('list')}
        />
      </div>
    );
  }

  if (panel === 'edit' && selectedJob) {
    return (
      <div className="view">
        <JobEditForm
          job={selectedJob}
          onSave={saveJob}
          onCancel={() => setPanel('detail')}
        />
      </div>
    );
  }

  // ── List view ─────────────────────────────────────────────────────────────
  return (
    <div className="view">
      <div className="pg-hd">
        <div>
          <div className="pg-tag">Open Roles</div>
          <h1 className="pg-title">Jobs <em>Board</em></h1>
          <div className="pg-sub">{openJobs} active roles · {depts} departments</div>
        </div>
        <div className="pg-actions">
          <button className="btn btn-ghost btn-sm">Export</button>
          <button className="btn btn-primary btn-sm" onClick={() => openModal('new-job')}>+ Post Job</button>
        </div>
      </div>

      <div className="card">
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                {['Title','Department','Type','Location','Status','Applicants','Link','Actions'].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {jobs.map(job => (
                <tr key={job.id} style={{ cursor:'pointer' }}>
                  <td className="td-strong" onClick={() => openJob(job)} style={{ textDecoration:'underline dotted', textUnderlineOffset:3 }}>
                    {job.title}
                  </td>
                  <td><span className="dept-tag">{job.dept}</span></td>
                  <td style={{ fontFamily:'var(--mono)', fontSize:'0.72rem', color:'var(--g3)' }}>{job.type}</td>
                  <td style={{ color:'var(--g3)', fontSize:'0.8rem' }}>{job.location}</td>
                  <td>
                    <span className={`pill ${job.status === 'Open' ? 'pill-open' : job.status === 'Draft' ? 'pill-draft' : 'pill-closed'}`}>
                      <span className="pill-dot" />{job.status}
                    </span>
                  </td>
                  <td style={{ fontFamily:'var(--mono)', fontSize:'0.78rem' }}>
                    {job.applicants > 0 ? job.applicants : '—'}
                  </td>
                  <td>
                    {job.status === 'Open'
                      ? <span className="job-link-cell" onClick={() => openPortal(job)}><span style={{display:"flex",alignItems:"center",gap:5}}><IconLink size={12} /> Copy link</span></span>
                      : <span style={{ fontFamily:'var(--mono)', fontSize:'0.62rem', color:'var(--g3)' }}>—</span>
                    }
                  </td>
                  <td>
                    <div style={{ display:'flex', gap:4 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => openJob(job)}>View</button>
                      {job.status === 'Draft'  && <button className="btn btn-primary btn-sm" onClick={() => publishJob(job.id)}>Publish</button>}
                      {job.status === 'Paused' && <button className="btn btn-warning btn-sm" onClick={() => publishJob(job.id)}>Resume</button>}
                      {job.status === 'Open'   && <button className="btn btn-ghost btn-sm" onClick={() => openPortal(job)}>Apply</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
