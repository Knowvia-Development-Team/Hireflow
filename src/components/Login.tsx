import { useState } from 'react';
import { authService } from '@/features/auth/services/authService';
import type { UserRole } from '@/types';

interface Props {
  onLogin: (user: { id: string; name: string; email: string; role: UserRole; initials: string }, accessToken: string) => void;
}

export default function Login({ onLogin }: Props): JSX.Element {
  const [email, setEmail] = useState('mika.sato@northgrid.io');
  const [password, setPassword] = useState('Password123!');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (): Promise<void> => {
    setError(null);
    setLoading(true);
    try {
      const { user, accessToken } = await authService.login(email.trim(), password);
      const initials = user.name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
      await new Promise(resolve => setTimeout(resolve, 3000));
      onLogin({ ...user, initials }, accessToken);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Login failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="auth-loading">
        <div className="auth-loading-card">
          <div className="auth-loading-logo">
            <span className="auth-loading-h">Hire</span>
            <span className="auth-loading-f">Flow</span>
          </div>
          <div className="auth-loading-title">Signing you in</div>
          <div className="auth-loading-sub">Verifying credentials and preparing your workspace…</div>
          <div className="auth-loading-spinner" aria-label="Loading" />
        </div>
      </div>
    );
  }

  return (
    <div className="login-wrap">
      <div className="login-box">
        <div className="login-logo"><span className="h">Hire</span><span className="f">Flow</span></div>
        <div className="login-title">Welcome back</div>
        <div className="login-sub">Sign in to your workspace</div>
        <div className="login-field">
          <label className="login-label">Email</label>
          <input className="login-input" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" />
        </div>
        <div className="login-field">
          <label className="login-label">Password</label>
          <input className="login-input" type="password" value={password} onChange={e => setPassword(e.target.value)} />
        </div>
        {error && <div style={{ color:'var(--red)', fontSize:'0.8rem', marginBottom:10 }}>{error}</div>}
        <button className="login-btn" onClick={() => void handleLogin()} disabled={loading}>
          {loading ? 'Signing in...' : 'Sign in ->'}
        </button>
      </div>
    </div>
  );
}
