import { useState, useCallback, memo } from 'react';
import {
  IconSearch, IconSun, IconMoon, IconBell, IconX,
} from '@/shared/components/ui/Icons';
import type { ViewId, Candidate } from '@/types';

interface Props {
  isDark:       boolean;
  toggleTheme:  () => void;
  onNotifClick: () => void;
  onLogoClick:  () => void;
  candidates:   Candidate[];
  setView:      (v: ViewId, c?: Candidate) => void;
}

export default memo(function Topbar({
  isDark, toggleTheme, onNotifClick, onLogoClick, candidates, setView,
}: Props): JSX.Element {
  const [query,   setQuery]   = useState('');
  const [results, setResults] = useState<Candidate[]>([]);
  const [focused, setFocused] = useState(false);

  const handleSearch = useCallback((val: string) => {
    setQuery(val);
    if (!val.trim()) { setResults([]); return; }
    const q = val.toLowerCase();
    setResults(
      candidates
        .filter(c =>
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.role.toLowerCase().includes(q),
        )
        .slice(0, 6),
    );
  }, [candidates]);

  const clearSearch = useCallback(() => {
    setQuery('');
    setResults([]);
  }, []);

  const selectResult = useCallback((c: Candidate) => {
    setResults([]);
    setQuery('');
    setView('profile', c);
  }, [setView]);

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

          <label htmlFor="global-search" className="sr-only">Search candidates by name, email or role</label>
          <input
            id="global-search"
            type="search"
            className="tb-search-input"
            placeholder="Search candidates…"
            value={query}
            onChange={e => handleSearch(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 150)}
            autoComplete="off"
            aria-autocomplete="list"
            aria-controls="search-results"
            aria-expanded={results.length > 0}
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
              <div className="tb-search-drop-hd">Candidates</div>
              {results.map(c => (
                <div
                  key={c.id}
                  className="tb-search-item"
                  role="option"
                  aria-selected="false"
                  onClick={() => selectResult(c)}
                  onKeyDown={e => { if (e.key === 'Enter') selectResult(c); }}
                  tabIndex={0}
                >
                  <div className="tb-si-av">{c.initials}</div>
                  <div className="tb-si-body">
                    <div className="tb-si-name">{c.name}</div>
                    <div className="tb-si-meta">{c.role} · <span className={`tb-si-stage stage-${c.stageKey.toLowerCase()}`}>{c.stage}</span></div>
                  </div>
                  <div className="tb-si-score">{c.score}</div>
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
