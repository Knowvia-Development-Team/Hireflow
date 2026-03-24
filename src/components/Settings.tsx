import { useState } from 'react';
import { getRoleClass } from '@/utils';
import type { AuditEntry, ToastColor } from '@/types';

type SettingsTab = 'general' | 'account' | 'notifications' | 'team' | 'integrations' | 'billing' | 'apikeys' | 'auditlog';

interface Toggle { emailNotifs: boolean; slackNotifs: boolean; aiScoring: boolean; autoReject: boolean; }

interface TeamMember { name: string; email: string; role: string; initials: string; }
const TEAM: TeamMember[] = [
  { name: 'Tino Dube',    email: 'tino@hireflow.io',    role: 'Admin',       initials: 'TD' },
  { name: 'James Khumalo',email: 'james@hireflow.io',   role: 'Recruiter',   initials: 'JK' },
  { name: 'Sarah Moyo',   email: 'sarah@hireflow.io',   role: 'Interviewer', initials: 'SM' },
  { name: 'Priya Singh',  email: 'priya.s@hireflow.io', role: 'Read-only',   initials: 'PS' },
];

interface Integration { name: string; desc: string; active: boolean; }
const INTEGRATIONS: Integration[] = [
  { name: 'Google Meet', desc: 'Video interviews & calendar sync', active: true  },
  { name: 'SendGrid',    desc: 'Transactional email delivery',     active: true  },
  { name: 'Slack',       desc: 'Team notifications',               active: false },
  { name: 'Zoom',        desc: 'Alternative video platform',       active: false },
];

const TABS: SettingsTab[] = ['general','account','notifications','team','integrations','billing','apikeys','auditlog'];

interface Props {
  isDark:       boolean;
  toggleTheme:  () => void;
  auditLog:     AuditEntry[];
  showToast:    (title: string, msg: string, color?: ToastColor) => void;
}

export default function Settings({ isDark, toggleTheme, auditLog, showToast }: Props): JSX.Element {
  const [tab,     setTab]     = useState<SettingsTab>('general');
  const [toggles, setToggles] = useState<Toggle>({ emailNotifs: true, slackNotifs: false, aiScoring: true, autoReject: false });

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
            </>
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
              <div className="settings-sec-hd">Team Members <button className="btn btn-primary btn-sm">Invite</button></div>
              {TEAM.map(m => (
                <div key={m.email} className="team-row">
                  <div className="team-av">{m.initials}</div>
                  <div className="team-info"><div className="team-name">{m.name}</div><div className="team-email">{m.email}</div></div>
                  <span className={`s-role-badge ${getRoleClass(m.role)}`}>{m.role}</span>
                  <button className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto' }}>Edit</button>
                </div>
              ))}
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
              <div className="settings-row"><div><div className="sr-label">Seats</div><div className="sr-sub">4 of 10 used</div></div><span style={{ fontFamily: 'var(--mono)', fontSize: '0.76rem', color: 'var(--g2)' }}>4 / 10</span></div>
              <div className="settings-row"><div><div className="sr-label">AI CV Analyses</div><div className="sr-sub">This billing cycle</div></div><span style={{ fontFamily: 'var(--mono)', fontSize: '0.76rem', color: 'var(--g2)' }}>247 / 500</span></div>
              <div className="settings-row"><div><div className="sr-label">Next Invoice</div><div className="sr-sub">April 1, 2026</div></div><span style={{ fontFamily: 'var(--mono)', fontSize: '0.76rem', color: 'var(--g2)' }}>$149.00</span></div>
            </div>
          )}

          {tab === 'apikeys' && (
            <div className="settings-section">
              <div className="settings-sec-hd">
                API Keys
                <button className="btn btn-primary btn-sm" onClick={() => showToast('Key Generated', 'hf_key_' + Math.random().toString(36).slice(2), 'green')}>Generate new key</button>
              </div>
              {[
                { name: 'Production Key', created: 'Mar 1, 2026',  lastUsed: '2 min ago',  val: 'hf_prod_••••••••7a2f' },
                { name: 'Staging Key',    created: 'Feb 10, 2026', lastUsed: '1 day ago',  val: 'hf_stg_••••••••9c1a'  },
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
    </div>
  );
}
