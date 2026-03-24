import { useState } from 'react';
import type { UserRole } from '@/types';

interface Props {
  onLogin: (role: UserRole) => void;
}

const ROLES: UserRole[] = ['Admin', 'Recruiter', 'Interviewer', 'Read-only'];

export default function Login({ onLogin }: Props): JSX.Element {
  const [role, setRole] = useState<UserRole>('Admin');

  return (
    <div className="login-wrap">
      <div className="login-box">
        <div className="login-logo"><span className="h">Hire</span><span className="f">Flow</span></div>
        <div className="login-title">Welcome back</div>
        <div className="login-sub">Sign in to your workspace</div>
        <div className="login-field">
          <label className="login-label">Email</label>
          <input className="login-input" defaultValue="tino@hireflow.io" placeholder="you@company.com" />
        </div>
        <div className="login-field">
          <label className="login-label">Password</label>
          <input className="login-input" type="password" defaultValue="••••••••" />
        </div>
        <div style={{ marginBottom: 10 }}>
          <label className="login-label" style={{ marginBottom: 7, display: 'block' }}>Role</label>
          <div className="login-roles">
            {ROLES.map(r => (
              <button key={r} className={`role-btn${role === r ? ' active' : ''}`} onClick={() => setRole(r)}>
                {r}
              </button>
            ))}
          </div>
        </div>
        <button className="login-btn" onClick={() => onLogin(role)}>Sign in →</button>
      </div>
    </div>
  );
}
