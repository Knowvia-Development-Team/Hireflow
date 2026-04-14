import { useEffect, useState } from 'react';
import { getRoleClass, makeInitials } from '@/utils';
import { useAuthStore } from '@/features/auth/store/authStore';
import { get, post } from '@/shared/lib/api/client';
import type { AuditEntry, ToastColor } from '@/types';
import { InviteUserModal, type InviteUserData } from './Modals';

type SettingsTab = 'general' | 'account' | 'notifications' | 'team' | 'integrations' | 'billing' | 'apikeys' | 'auditlog';

interface Toggle { emailNotifs: boolean; slackNotifs: boolean; aiScoring: boolean; autoReject: boolean; }

interface InterviewDefaults {
  defaultDuration: number;
  defaultType: string;
}

interface TeamMember { id: string; name: string; email: string; role: string; initials: string; }

interface Integration { name: string; desc: string; active: boolean; }
const INTEGRATIONS: Integration[] = [
  { name: 'Google Meet', desc: 'Video interviews and calendar sync', active: true  },
  { name: 'Resend',      desc: 'Transactional email delivery',       active: true  },
  { name: 'Linear',      desc: 'Hiring workflow handoff to product',  active: false },
  { name: 'Notion',      desc: 'Scorecard templates and playbooks',   active: false },
];

const TABS: SettingsTab[] = ['general','account','notifications','team','integrations','billing','apikeys','auditlog'];

interface Props {
  isDark:            boolean;
  toggleTheme:       () => void;
  auditLog:          AuditEntry[];
  showToast:         (title: string, msg: string, color?: ToastColor) => void;
  interviewDefaults: { defaultDuration: number; defaultType: string };
  onUpdateInterviewDefaults?: (defaults: { defaultDuration: number; defaultType: string }) => void;
}

export default function Settings({ isDark, toggleTheme, auditLog, showToast, interviewDefaults, onUpdateInterviewDefaults }: Props): JSX.Element {
  const [tab,     setTab]     = useState<SettingsTab>('general');
  const [toggles, setToggles] = useState<Toggle>({ emailNotifs: true, slackNotifs: false, aiScoring: true, autoReject: false });
  const [localDefaults, setLocalDefaults] = useState<InterviewDefaults>(interviewDefaults);
  const user = useAuthStore(s => s.user);
  const roleLabel = user?.role ?? 'Read-only';
  const nameLabel = user?.name ?? '—';
  const emailLabel = user?.email ?? '—';
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [teamLoading, setTeamLoading] = useState(false);
  const [teamError, setTeamError] = useState<string | null>(null);
  const [showInvite, setShowInvite] = useState(false);

  const formatRole = (role: string): string => {
    const normalized = role.toLowerCase().replace(/_/g, '-');
    if (normalized === 'read-only' || normalized === 'readonly') return 'Read-only';
    if (normalized === 'admin') return 'Admin';
    if (normalized === 'recruiter') return 'Recruiter';
    if (normalized === 'interviewer') return 'Interviewer';
    return role;
  };

  useEffect(() => {
    if (tab !== 'team') return;
    let mounted = true;
    const loadTeam = async () => {
      setTeamLoading(true);
      setTeamError(null);
      try {
        const result = await get<TeamMember[]>('/api/data/users');
        if (!mounted) return;
        const formatted = result.map(member => ({
          ...member,
          role: formatRole(member.role),
          initials: member.initials || makeInitials(member.name),
        }));
        setTeamMembers(formatted);
      } catch (error) {
        if (!mounted) return;
        setTeamError('Unable to load team members.');
      } finally {
        if (mounted) setTeamLoading(false);
      }
    };
    loadTeam();
    return () => { mounted = false; };
  }, [tab]);

  const handleInvite = async (data: InviteUserData): Promise<void> => {
    try {
      const result = await post<{ user: TeamMember; tempPassword: string }>('/api/data/users', data);
      const formatted = {
        ...result.user,
        role: formatRole(result.user.role),
        initials: result.user.initials || makeInitials(result.user.name),
      };
      setTeamMembers(prev => [formatted, ...prev]);
      showToast('Invite sent', `${formatted.name} added. Temp password: ${result.tempPassword}`, 'green');
    } catch (error: any) {
      showToast('Invite failed', error?.message || 'Unable to add team member.', 'amber');
    }
  };

  const flip = (k: keyof Toggle): void => setToggles(p => ({ ...p, [k]: !p[k] }));

  return (
    <div className="view">
      <div className="pg-hd">
        <div><div className="pg-tag">Configuration</div><h1 className="pg-title">Settings</h1></div>
      </div>

      <div className="settings-layout">
        <div className="settings-nav">
          {TABS.map(t => (
            <div key={t} className={`settings-nav-item${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>
              {t[0]!.toUpperCase() + t.slice(1)}
            </div>
          ))}
        </div>

        <div>
          {tab === 'general' && (
            <>
              <div className="settings-section">
                <div className="settings-sec-hd">Supabase Connection</div>
                <div className="settings-row"><div><div className="sr-label">Project URL</div><div className="sr-sub" style={{ fontFamily: 'var(--mono)', fontSize: '0.7rem' }}>supabase.hireflow.io</div></div><span className="pill pill-open"><span className="pill-dot" />Connected</span></div>
                <div className="settings-row"><div><div className="sr-label">Realtime</div><div className="sr-sub">Postgres CDC subscriptions active</div></div><span className="pill pill-open"><span className="pill-dot" />Active</span></div>
              </div>
              <div className="settings-section">
                <div className="settings-sec-hd">Appearance</div>
                <div className="settings-row">
                  <div><div className="sr-label">Theme</div><div className="sr-sub">Toggle light / dark mode</div></div>
                  <button className={`toggle${isDark ? ' on' : ''}`} onClick={toggleTheme} />
                </div>
              </div>
              <div className="settings-section">
                <div className="settings-sec-hd">Infrastructure</div>
                {([['CDN','Static asset delivery','Cloudflare CDN'],['Compute','API server scaling','AWS ECS / Kubernetes'],['Database','Primary + replicas','PostgreSQL + PgBouncer'],['Monitoring','Tracing + alerting','Datadog / PagerDuty']] as const).map(([l, s, v]) => (
                  <div key={l} className="settings-row"><div><div className="sr-label">{l}</div><div className="sr-sub">{s}</div></div><span style={{ fontFamily: 'var(--mono)', fontSize: '0.76rem', color: 'var(--g2)' }}>{v}</span></div>
                ))}
              </div>
              <div className="settings-section">
                <div className="settings-sec-hd">Interview Defaults</div>
                <div className="settings-row">
                  <div><div className="sr-label">Default Duration</div><div className="sr-sub">Automatically set duration for new interviews</div></div>
                  <select className="form-select" style={{ width: 120 }} value={localDefaults.defaultDuration} onChange={e => { const val = Number(e.target.value); setLocalDefaults(p => ({ ...p, defaultDuration: val })); onUpdateInterviewDefaults?.({ ...localDefaults, defaultDuration: val }); }}>
                    <option value={15}>15 min</option>
                    <option value={30}>30 min</option>
                    <option value={45}>45 min</option>
                    <option value={60}>60 min</option>
                    <option value={90}>90 min</option>
                    <option value={120}>120 min</option>
                  </select>
                </div>
                <div className="settings-row">
                  <div><div className="sr-label">Default Interview Type</div><div className="sr-sub">Pre-selected type when scheduling</div></div>
                  <select className="form-select" style={{ width: 140 }} value={localDefaults.defaultType} onChange={e => { const val = e.target.value; setLocalDefaults(p => ({ ...p, defaultType: val })); onUpdateInterviewDefaults?.({ ...localDefaults, defaultType: val }); }}>
                    <option>Screening</option>
                    <option>Technical</option>
                    <option>Final</option>
                    <option>Culture</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {tab === 'account' && (
            <div className="settings-section">
              <div className="settings-sec-hd">Account</div>
              <div className="settings-row">
                <div>
                  <div className="sr-label">Name</div>
                  <div className="sr-sub">Primary account holder</div>
                </div>
                <span style={{ fontFamily: 'var(--mono)', fontSize: '0.78rem', color: 'var(--g2)' }}>{nameLabel}</span>
              </div>
              <div className="settings-row">
                <div>
                  <div className="sr-label">Email</div>
                  <div className="sr-sub">Used for login and alerts</div>
                </div>
                <span style={{ fontFamily: 'var(--mono)', fontSize: '0.78rem', color: 'var(--g2)' }}>{emailLabel}</span>
              </div>
              <div className="settings-row">
                <div>
                  <div className="sr-label">Role</div>
                  <div className="sr-sub">Permissions and access scope</div>
                </div>
                <span className={`s-role-badge ${getRoleClass(roleLabel)}`}>{roleLabel}</span>
              </div>
              <div className="settings-row">
                <div>
                  <div className="sr-label">Password</div>
                  <div className="sr-sub">Last updated 30 days ago</div>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => showToast('Password Reset', 'Password reset email sent.', 'green')}>
                  Reset password
                </button>
              </div>
            </div>
          )}

          {tab === 'notifications' && (
            <div className="settings-section">
              <div className="settings-sec-hd">Notification Preferences</div>
              {([
                { key: 'emailNotifs' as keyof Toggle, label: 'Email Notifications',          sub: 'Receive alerts via email'               },
                { key: 'slackNotifs' as keyof Toggle, label: 'Slack Notifications',           sub: 'Send to #recruiting channel'            },
                { key: 'aiScoring'  as keyof Toggle,  label: 'AI CV Scoring',                sub: 'Auto-score CVs on upload'               },
                { key: 'autoReject' as keyof Toggle,  label: 'Auto-reject below threshold',  sub: 'Reject scores below 30 automatically'   },
              ]).map(({ key, label, sub }) => (
                <div key={key} className="settings-row">
                  <div><div className="sr-label">{label}</div><div className="sr-sub">{sub}</div></div>
                  <button className={`toggle${toggles[key] ? ' on' : ''}`} onClick={() => flip(key)} />
                </div>
              ))}
            </div>
          )}

          {tab === 'team' && (
            <div className="settings-section">
              <div className="settings-sec-hd">
                Team Members
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => setShowInvite(true)}
                >
                  Invite
                </button>
              </div>
              {teamLoading ? (
                <div style={{ padding: 16, color: 'var(--g3)', fontSize: '0.8rem' }}>Loading team…</div>
              ) : teamError ? (
                <div style={{ padding: 16, color: 'var(--red)', fontSize: '0.8rem' }}>{teamError}</div>
              ) : teamMembers.length === 0 ? (
                <div style={{ padding: 16, color: 'var(--g3)', fontSize: '0.8rem' }}>No team members found.</div>
              ) : (
                teamMembers.map(m => (
                  <div key={m.id} className="team-row">
                    <div className="team-av">{m.initials}</div>
                    <div className="team-info"><div className="team-name">{m.name}</div><div className="team-email">{m.email}</div></div>
                    <span className={`s-role-badge ${getRoleClass(m.role)}`}>{m.role}</span>
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ marginLeft: 'auto' }}
                      onClick={() => showToast('Edit team member', `${m.name} — role: ${m.role}`, 'blue')}
                    >
                      Edit
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === 'integrations' && (
            <div className="settings-section">
              <div className="settings-sec-hd">Connected Integrations</div>
              {INTEGRATIONS.map(i => (
                <div key={i.name} className="int-row">
                  <div><div className="int-name">{i.name}</div><div className="int-desc">{i.desc}</div></div>
                  <span className={`int-connected ${i.active ? 'int-active' : 'int-inactive'}`}>
                    {i.active ? 'Connected' : 'Not connected'}
                  </span>
                </div>
              ))}
            </div>
          )}

          {tab === 'billing' && (
            <div className="settings-section">
              <div className="settings-sec-hd">Current Plan</div>
              <div className="settings-row"><div><div className="sr-label">Plan</div><div className="sr-sub">Billed monthly</div></div><span className="pill pill-purple"><span className="pill-dot" />Pro Team</span></div>
              <div className="settings-row"><div><div className="sr-label">Seats</div><div className="sr-sub">5 of 12 used</div></div><span style={{ fontFamily: 'var(--mono)', fontSize: '0.76rem', color: 'var(--g2)' }}>5 / 12</span></div>
              <div className="settings-row"><div><div className="sr-label">AI CV Analyses</div><div className="sr-sub">This billing cycle</div></div><span style={{ fontFamily: 'var(--mono)', fontSize: '0.76rem', color: 'var(--g2)' }}>198 / 600</span></div>
              <div className="settings-row"><div><div className="sr-label">Next Invoice</div><div className="sr-sub">April 15, 2026</div></div><span style={{ fontFamily: 'var(--mono)', fontSize: '0.76rem', color: 'var(--g2)' }}>$189.00</span></div>
            </div>
          )}

          {tab === 'apikeys' && (
            <div className="settings-section">
              <div className="settings-sec-hd">
                API Keys
                <button className="btn btn-primary btn-sm" onClick={() => showToast('Key Generated', 'hf_key_' + Math.random().toString(36).slice(2), 'green')}>Generate new key</button>
              </div>
              {[
                { name: 'Production Key', created: 'Mar 6, 2026',  lastUsed: '5 min ago',  val: 'hf_prod_********2f8c' },
                { name: 'Staging Key',    created: 'Feb 21, 2026', lastUsed: '3 days ago', val: 'hf_stg_********9d14'  },
              ].map(k => (
                <div key={k.name} className="api-key-row">
                  <div className="api-key-name">
                    {k.name}
                    <div style={{ fontSize: '0.72rem', color: 'var(--g3)' }}>Created {k.created} · Last used {k.lastUsed}</div>
                  </div>
                  <span className="api-key-val">{k.val}</span>
                  <button className="btn btn-ghost btn-sm">Revoke</button>
                </div>
              ))}
            </div>
          )}

          {tab === 'auditlog' && (
            <div className="settings-section">
              <div className="settings-sec-hd">
                Audit Log
                <span style={{ fontFamily: 'var(--mono)', fontSize: '0.62rem', color: 'var(--g3)', fontWeight: 400 }}>
                  Immutable — all mutations logged
                </span>
              </div>
              {auditLog.map((entry, i) => (
                <div key={i} className="audit-row">
                  <span className="audit-actor">{entry.actor}</span>
                  <span className="audit-action">{entry.action}</span>
                  <span className="audit-time">{entry.time}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {showInvite && (
        <InviteUserModal
          onClose={() => setShowInvite(false)}
          onSubmit={handleInvite}
        />
      )}
    </div>
  );
}
