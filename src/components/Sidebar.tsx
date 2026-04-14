import { useEffect, useRef, useState } from 'react';
import { getRoleClass } from '@/utils';
import { useAuthStore } from '@/features/auth/store/authStore';
import { authService } from '@/features/auth/services/authService';
import type { ViewId, UserRole, Candidate, Job, Email } from '@/types';

interface NavItem { id: ViewId; label: string; badgeKey?: keyof BadgeCounts; }
interface BadgeCounts { candidates: number; jobs: number; emails: number; }

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard',   label: 'Dashboard' },
  { id: 'candidates',  label: 'Candidates',         badgeKey: 'candidates' },
  { id: 'jobs',        label: 'Jobs',               badgeKey: 'jobs' },
  { id: 'schedule',    label: 'Interview Schedule' },
  { id: 'connections', label: 'Connections',        badgeKey: 'emails' },
  { id: 'history',     label: 'History' },
  { id: 'scores',      label: 'Scores' },
];

interface Props {
  view:       ViewId;
  setView:    (v: ViewId) => void;
  role:       UserRole;
  candidates: Candidate[];
  jobs:       Job[];
  emails:     Email[];
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

function NavIcon({ id }: { id: string }): JSX.Element {
  if (id === 'dashboard')
    return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>;
  if (id === 'candidates')
    return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
  if (id === 'jobs')
    return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>;
  if (id === 'schedule')
    return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
  if (id === 'connections')
    return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>;
  if (id === 'history')
    return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
  if (id === 'scores')
    return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/></svg>;
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>;
}

export default function Sidebar({ view, setView, role, candidates, jobs, emails, collapsed, onToggleCollapse }: Props): JSX.Element {
  const user = useAuthStore(s => s.user);
  const doLogout = useAuthStore(s => s.logout);
  const userName = user?.name ?? 'Account';
  const userInitials = user?.initials ?? 'HF';
  const userRole = user?.role ?? role;
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const badges: BadgeCounts = {
    candidates: candidates.length,
    jobs:       jobs.length,
    emails:     emails.filter(e => e.unread).length,
  };

  useEffect(() => {
    if (!menuOpen) return;
    const handle = (event: MouseEvent): void => {
      const target = event.target as Node | null;
      if (menuRef.current && target && !menuRef.current.contains(target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [menuOpen]);

  const handleLogout = async (): Promise<void> => {
    setMenuOpen(false);
    try {
      await authService.logout();
    } catch {
      // ignore network errors; clear local session anyway
    } finally {
      doLogout();
      setView('dashboard');
    }
  };

  return (
    <aside className={`sidebar${collapsed ? ' collapsed' : ''}`}>
      <div className="nav-grp">
        <div className="nav-lbl">Main</div>
        {NAV_ITEMS.map(item => {
          const badgeVal = item.badgeKey !== undefined ? badges[item.badgeKey] : 0;
          return (
            <div key={item.id}
              className={`nav-item${(view === item.id || (view === 'profile' && item.id === 'candidates')) ? ' active' : ''}`}
              onClick={() => setView(item.id)}>
              <span className="nav-icon"><NavIcon id={item.id} /></span>
              {!collapsed && <>{item.label}{badgeVal > 0 && <span className="nav-badge">{badgeVal}</span>}</>}
            </div>
          );
        })}
      </div>

      <div className="nav-grp">
        <div className="nav-lbl">Account</div>
        <div className={`nav-item${view === 'settings' ? ' active' : ''}`} onClick={() => setView('settings')}>
          <span className="nav-icon"><NavIcon id="settings" /></span>
          {!collapsed && 'Settings'}
        </div>
        <div 
          className="nav-item" 
          onClick={onToggleCollapse}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          style={{ cursor: 'pointer' }}
        >
          <span className="nav-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {collapsed ? <polyline points="9 18 15 12 9 6"/> : <polyline points="15 18 9 12 15 6"/>}
            </svg>
          </span>
          {!collapsed && (collapsed ? 'Expand' : 'Collapse')}
        </div>
      </div>

      <div className="sidebar-foot" ref={menuRef}>
        <div className="s-user">
          <div className="s-av">{userInitials}</div>
          <div>
            <div className="s-name">{userName}</div>
            <span className={`s-role-badge ${getRoleClass(userRole)}`}>{userRole}</span>
          </div>
          <button
            type="button"
            className="s-dots"
            aria-label="Account menu"
            onClick={() => setMenuOpen(v => !v)}
          >
            ···
          </button>
        </div>
        {menuOpen && (
          <div className="s-menu" role="menu">
            <button type="button" className="s-menu-item" role="menuitem" onClick={() => void handleLogout()}>
              Sign out
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
