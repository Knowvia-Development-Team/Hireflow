import { useState, useEffect } from 'react';
import { get } from '@/shared/lib/api/client';
import type { HistoryRecord } from '@/types';

type HistoryTab = 'rejected' | 'hired';

interface HistoryStats {
  rejected: number;
  hired: number;
}

export default function HistoryPage(): JSX.Element {
  const [activeTab, setActiveTab] = useState<HistoryTab>('rejected');
  const [historyData, setHistoryData] = useState<HistoryRecord[]>([]);
  const [stats, setStats] = useState<HistoryStats>({ rejected: 0, hired: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHistory();
    fetchStats();
  }, [activeTab]);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await get<{ success: boolean; data: HistoryRecord[] }>(`/api/history?status=${activeTab}`);
      if (result.success) {
        setHistoryData(result.data);
      }
    } catch (error) {
      console.error('[History] Error fetching history:', error);
      setError('Unable to load history data.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const result = await get<{ success: boolean; data: HistoryStats }>('/api/history/stats');
      if (result.success) {
        setStats(result.data);
      }
    } catch (error) {
      console.error('[History] Error fetching stats:', error);
    }
  };

  const filteredData = searchTerm
    ? historyData.filter(
        item =>
          item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : historyData;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="view">
      <div className="pg-hd">
        <div>
          <div className="pg-tag">Hiring Analytics</div>
          <h1 className="pg-title">History</h1>
          <div className="pg-sub">
            Track all rejected and hired candidates
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 24 }}>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: 'rgba(220,38,38,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--g3)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Rejected
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 600, color: 'var(--white)' }}>
                {stats.rejected}
              </div>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: 'rgba(34,197,94,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--g3)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Hired
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 600, color: 'var(--white)' }}>
                {stats.hired}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="filters" role="tablist" aria-label="Filter by status">
        <div
          role="tab"
          aria-selected={activeTab === 'rejected'}
          className={`filter${activeTab === 'rejected' ? ' active' : ''}`}
          style={activeTab !== 'rejected' ? { color: 'var(--red)' } : undefined}
          onClick={() => setActiveTab('rejected')}
          onKeyDown={e => { if (e.key === 'Enter') setActiveTab('rejected'); }}
          tabIndex={0}
        >
          Rejected ({stats.rejected})
        </div>
        <div
          role="tab"
          aria-selected={activeTab === 'hired'}
          className={`filter${activeTab === 'hired' ? ' active' : ''}`}
          style={activeTab !== 'hired' ? { color: 'var(--green)' } : undefined}
          onClick={() => setActiveTab('hired')}
          onKeyDown={e => { if (e.key === 'Enter') setActiveTab('hired'); }}
          tabIndex={0}
        >
          Hired ({stats.hired})
        </div>
      </div>

      {/* Search */}
      <div style={{ marginBottom: 16 }}>
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            maxWidth: 300,
            padding: '10px 16px',
            borderRadius: 8,
            border: '1px solid var(--bor)',
            background: 'var(--bg2)',
            color: 'var(--white)',
            fontSize: '0.875rem',
          }}
        />
      </div>

      {/* Table */}
      <div className="card">
        {loading ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--g3)' }}>
            Loading...
          </div>
        ) : error ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--red)' }}>
            {error}
          </div>
        ) : filteredData.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--g3)', fontFamily: 'var(--mono)', fontSize: '0.72rem' }}>
            No candidates in this category.
          </div>
        ) : (
          <>
            <div
              role="row"
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 140px 140px 140px',
                gap: 10,
                padding: '8px 16px',
                borderBottom: '1px solid var(--bor2)',
              }}
            >
              {['Name', 'Job Title', 'Status', 'Date'].map((h, i) => (
                <div
                  key={i}
                  role="columnheader"
                  style={{ fontFamily: 'var(--mono)', fontSize: '0.58rem', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--g3)' }}
                >
                  {h}
                </div>
              ))}
            </div>

            {filteredData.map(item => (
              <div
                key={item.id}
                role="row"
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 140px 140px 140px',
                  gap: 10,
                  padding: '12px 16px',
                  borderBottom: '1px solid var(--bor2)',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div className="cand-name">{item.name}</div>
                  <div className="cand-email">{item.email}</div>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--g2)' }}>{item.jobTitle || 'N/A'}</div>
                <div>
                  <span
                    className="pill"
                    style={{
                      background: item.status === 'hired' ? 'rgba(34,197,94,0.15)' : 'rgba(220,38,38,0.15)',
                    }}
                  >
                    <span
                      className="pill-dot"
                      style={{ background: item.status === 'hired' ? 'var(--green)' : 'var(--red)' }}
                    />
                    {item.status === 'hired' ? 'Hired' : 'Rejected'}
                  </span>
                </div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: '0.62rem', color: 'var(--g3)' }}>
                  {formatDate(item.decidedAt)}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
