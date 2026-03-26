import { useState, useCallback, memo } from 'react';
import {
  IconSearch, IconSun, IconMoon, IconBell, IconX,
} from '@/shared/components/ui/Icons';
import type { ViewId, Candidate, Job } from '@/types';

// Searchable items type for unified search
type SearchItem = { type: 'candidate' | 'job' | 'setting'; title: string; subtitle: string; id: string };

interface Props {
  isDark:       boolean;
  toggleTheme:  () => void;
  onNotifClick: () => void;
  onLogoClick:  () => void;
  candidates:   Candidate[];
  jobs:         Job[];
  setView:      (v: ViewId, c?: Candidate) => void;
} // Props

export default memo(function Topbar({
  isDark, toggleTheme, onNotifClick, onLogoClick, candidates, jobs, setView,
}: Props): JSX.Element {
  // Searchable items type for unified search
  type SearchItem = { type: 'candidate' | 'job' | 'setting'; title: string; subtitle: string; id: string };

  const [query,   setQuery]   = useState('');
  const [results, setResults] = useState<SearchItem[]>([]);
  const [focused, setFocused] = useState(false);

  const handleSearch = useCallback((val: string) => {
    setQuery(val);
    if (!val.trim()) { setResults([]); return; }
    const q = val.toLowerCase();
    
    // Build search results from candidates, jobs, and settings
    const searchResults: SearchItem[] = [];
    
    // Search candidates
    candidates.forEach(c => {
      if (c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.role.toLowerCase().includes(q)) {
        searchResults.push({ type: 'candidate', title: c.name, subtitle: `${c.role} · ${c.stage}`, id: c.id });
      }
    });
    
    // Search jobs
    jobs.forEach(j => {
      if (j.title.toLowerCase().includes(q) || j.dept.toLowerCase().includes(q) || j.status.toLowerCase().includes(q)) {
        searchResults.push({ type: 'job', title: j.title, subtitle: `${j.dept} · ${j.status}`, id: j.id });
      }
    });
    
    // Search settings (static items)
    const settingsItems: SearchItem[] = [
      { type: 'setting', title: 'Profile Settings', subtitle: 'Account & preferences', id: 'settings-profile' },
      { type: 'setting', title: 'Team Settings', subtitle: 'Manage team members', id: 'settings-team' },
      { type: 'setting', title: 'Email Templates', subtitle: 'Configure email templates', id: 'settings-email' },
      { type: 'setting', title: 'Notifications', subtitle: 'Notification preferences', id: 'settings-notifications' },
      { type: 'setting', title: 'Integrations', subtitle: 'Third-party integrations', id: 'settings-integrations' },
      { type: 'setting', title: 'Billing', subtitle: 'Subscription & payments', id: 'settings-billing' },
    ];
    settingsItems.forEach(s => {
      if (s.title.toLowerCase().includes(q) || s.subtitle.toLowerCase().includes(q)) {
        searchResults.push(s);
      }
    });
    
    setResults(searchResults.slice(0, 8));
  }, [candidates, jobs]);

  const clearSearch = useCallback(() => {
    setQuery('');
    setResults([]);
  }, []);

  const selectResult = useCallback((item: SearchItem) => {
    setResults([]);
    setQuery('');
    
    if (item.type === 'candidate') {
      const candidate = candidates.find(c => c.id === item.id);
      if (candidate) setView('profile', candidate);
    } else if (item.type === 'job') {
      setView('jobs');
    } else if (item.type === 'setting') {
      setView('settings');
    }
  }, [candidates, setView]);

  return (
    <header className="topbar" role="banner">

      {/* ── Logo ─────────────────────────────────────────────────────── */}
      <div className="tb-left">
        <button
          className="tb-logo"
          onClick={onLogoClick}
          aria-label="HireFlow — go to dashboard"
        >
          <span className="tb-logo-h">Hire</span>
          <span className="tb-logo-f">Flow</span>
        </button>
      </div>

      {/* ── Search ───────────────────────────────────────────────────── */}
      <div className="tb-mid">
        <div
          className={`tb-search-wrap${focused ? ' tb-search-focused' : ''}`}
          role="search"
        >
          <IconSearch
            size={13}
            style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--g3)', pointerEvents:'none' }}
          />

          <label htmlFor="global-search" className="sr-only">Search candidates, jobs, or settings</label>
          <input
            id="global-search"
            type="search"
            className="tb-search-input"
            placeholder="Search candidates, jobs, settings…"
            value={query}
            onChange={e => handleSearch(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 150)}
            autoComplete="off"
            aria-autocomplete="list"
            aria-controls="search-results"
          />

          {query && (
            <button
              className="tb-search-clear"
              onClick={clearSearch}
              aria-label="Clear search"
              tabIndex={-1}
            >
              <IconX size={11} />
            </button>
          )}

          {/* Dropdown results */}
          {results.length > 0 && (
            <div id="search-results" className="tb-search-drop" role="listbox">
              {results.map((item) => (
                <div
                  key={`${item.type}-${item.id}`}
                  className="tb-search-item"
                  role="option"
                  aria-selected="false"
                  onClick={() => selectResult(item)}
                  onKeyDown={e => { if (e.key === 'Enter') selectResult(item); }}
                  tabIndex={0}
                >
                  <div className="tb-si-av">
                    {item.type === 'candidate' && candidates.find(c => c.id === item.id)?.initials}
                    {item.type === 'job' && '📁'}
                    {item.type === 'setting' && '⚙️'}
                  </div>
                  <div className="tb-si-body">
                    <div className="tb-si-name">{item.title}</div>
                    <div className="tb-si-meta">{item.subtitle}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Actions ──────────────────────────────────────────────────── */}
      <div className="tb-right">

        {/* Theme toggle */}
        <button
          className="tb-icon-btn"
          onClick={toggleTheme}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          title={isDark ? 'Light mode' : 'Dark mode'}
        >
          {isDark
            ? <IconSun  size={16} style={{ color:'var(--amber)' }} />
            : <IconMoon size={16} style={{ color:'var(--g2)' }} />
          }
        </button>

        {/* Notifications */}
        <button
          className="tb-notif-btn"
          onClick={onNotifClick}
          aria-label="Open notifications"
          title="Notifications"
        >
          <IconBell size={16} style={{ color:'var(--g2)' }} />
          <span className="tb-notif-dot" aria-label="3 unread">3</span>
        </button>

        {/* Divider */}
        <div className="tb-divider" aria-hidden="true" />

        {/* Avatar */}
        <button className="tb-avatar" aria-label="Account menu — Tino Dube (Admin)">
          <span className="tb-av-initials">TD</span>
          <div className="tb-av-info">
            <span className="tb-av-name">Tino Dube</span>
            <span className="tb-av-role">Admin</span>
          </div>
        </button>
      </div>
    </header>
  );
});
