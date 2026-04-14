import { useState, useEffect } from 'react';
import type { LeaderboardEntry } from '@/types';
import { get, post } from '@/shared/lib/api/client';

interface CandidateOption {
  id: string;
  fullName: string;
  email: string;
  jobTitle: string;
}

interface JobOption {
  id: string;
  title: string;
}

export default function InterviewScoresPage(): JSX.Element {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [candidates, setCandidates] = useState<CandidateOption[]>([]);
  const [jobs, setJobs] = useState<JobOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedJob, setSelectedJob] = useState('');

  // Form state
  const [candidateId, setCandidateId] = useState('');
  const [jobId, setJobId] = useState('');
  const [score, setScore] = useState('');
  const [interviewer, setInterviewer] = useState('');
  const [comments, setComments] = useState('');
  const [interviewDate, setInterviewDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchLeaderboard();
    fetchCandidates();
    fetchJobs();
  }, []);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const result = await get<{ success: boolean; data: LeaderboardEntry[] }>('/api/scores/leaderboard?limit=50');
      if (result.success) {
        setLeaderboard(result.data);
      }
    } catch (error) {
      console.error('[Scores] Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCandidates = async () => {
    try {
      const result = await get<{ success: boolean; data: CandidateOption[] }>('/api/scores/candidates');
      if (result.success) {
        setCandidates(result.data);
      }
    } catch (error) {
      console.error('[Scores] Error fetching candidates:', error);
    }
  };

  const fetchJobs = async () => {
    try {
      const result = await get<{ success: boolean; data: JobOption[] }>('/api/scores/jobs');
      if (result.success) {
        setJobs(result.data);
      }
    } catch (error) {
      console.error('[Scores] Error fetching jobs:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!candidateId || !jobId || !score || !interviewer || !interviewDate) {
      alert('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      const result = await post<{ success: boolean; error?: string }>(
        '/api/scores',
        {
          candidate_id: candidateId,
          job_id: jobId,
          score: Number(score),
          interviewer,
          comments,
          interview_date: interviewDate,
        },
      );
      if (result.success) {
        alert('Score saved successfully!');
        // Reset form
        setCandidateId('');
        setJobId('');
        setScore('');
        setInterviewer('');
        setComments('');
        setInterviewDate(new Date().toISOString().split('T')[0]);
        // Refresh leaderboard
        fetchLeaderboard();
      } else {
        alert(result.error || 'Failed to save score');
      }
    } catch (error) {
      console.error('[Scores] Error saving score:', error);
      alert('Failed to save score');
    } finally {
      setSaving(false);
    }
  };

  const getRankEmoji = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return '';
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'var(--green)';
    if (score >= 70) return 'var(--blue2)';
    if (score >= 50) return 'var(--amber)';
    return 'var(--red)';
  };

  const filteredCandidates = jobId
    ? candidates.filter(c => {
        // Filter by job - show all candidates if no specific job selected
        return true;
      })
    : candidates;

  return (
    <div className="view">
      <div className="pg-hd">
        <div>
          <div className="pg-tag">Interview Management</div>
          <h1 className="pg-title">Interview Scores</h1>
          <div className="pg-sub">
            Save interview scores and view ranked candidates
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: 24 }}>
        {/* Section 1: Score Entry Form */}
        <div className="card" style={{ padding: 24 }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 20, color: 'var(--white)' }}>
            Save New Score
          </h2>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--g3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '1px' }}>
                Job Position *
              </label>
              <select
                value={jobId}
                onChange={e => setJobId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--bor)',
                  background: 'var(--bg2)',
                  color: 'var(--white)',
                  fontSize: '0.875rem',
                }}
                required
              >
                <option value="">Select a job...</option>
                {jobs.map(job => (
                  <option key={job.id} value={job.id}>{job.title}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--g3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '1px' }}>
                Candidate *
              </label>
              <select
                value={candidateId}
                onChange={e => setCandidateId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--bor)',
                  background: 'var(--bg2)',
                  color: 'var(--white)',
                  fontSize: '0.875rem',
                }}
                required
                disabled={!jobId}
              >
                <option value="">Select a candidate...</option>
                {filteredCandidates.map(cand => (
                  <option key={cand.id} value={cand.id}>
                    {cand.fullName} - {cand.jobTitle || 'No job'}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--g3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '1px' }}>
                Score (0-100) *
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={score}
                onChange={e => setScore(e.target.value)}
                placeholder="Enter score"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--bor)',
                  background: 'var(--bg2)',
                  color: 'var(--white)',
                  fontSize: '0.875rem',
                }}
                required
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--g3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '1px' }}>
                Interviewer Name *
              </label>
              <input
                type="text"
                value={interviewer}
                onChange={e => setInterviewer(e.target.value)}
                placeholder="Enter interviewer name"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--bor)',
                  background: 'var(--bg2)',
                  color: 'var(--white)',
                  fontSize: '0.875rem',
                }}
                required
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--g3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '1px' }}>
                Interview Date *
              </label>
              <input
                type="date"
                value={interviewDate}
                onChange={e => setInterviewDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--bor)',
                  background: 'var(--bg2)',
                  color: 'var(--white)',
                  fontSize: '0.875rem',
                }}
                required
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--g3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '1px' }}>
                Comments
              </label>
              <textarea
                value={comments}
                onChange={e => setComments(e.target.value)}
                placeholder="Optional notes about the interview..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--bor)',
                  background: 'var(--bg2)',
                  color: 'var(--white)',
                  fontSize: '0.875rem',
                  resize: 'vertical',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary"
              style={{ width: '100%' }}
            >
              {saving ? 'Saving...' : 'Save Score'}
            </button>
          </form>
        </div>

        {/* Section 2: Leaderboard */}
        <div className="card" style={{ padding: 24 }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 20, color: 'var(--white)' }}>
            Leaderboard - Candidates by Score
          </h2>

          {loading ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--g3)' }}>
              Loading...
            </div>
          ) : leaderboard.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--g3)', fontFamily: 'var(--mono)', fontSize: '0.72rem' }}>
              No interview scores yet. Use the form to add scores.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {leaderboard.map(entry => (
                <div
                  key={entry.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px 16px',
                    background: entry.rank === 1 ? 'rgba(234,179,8,0.1)' : 'var(--bg2)',
                    borderRadius: 8,
                    border: entry.rank === 1 ? '1px solid rgba(234,179,8,0.3)' : '1px solid var(--bor)',
                  }}
                >
                  {/* Rank */}
                  <div style={{
                    width: 40,
                    fontSize: '1.25rem',
                    fontWeight: 600,
                    textAlign: 'center',
                  }}>
                    {getRankEmoji(entry.rank)}
                  </div>

                  {/* Candidate Info */}
                  <div style={{ flex: 1, marginLeft: 12 }}>
                    <div style={{ fontWeight: 600, color: 'var(--white)', fontSize: '0.9rem' }}>
                      {entry.candidateName}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--g3)' }}>
                      {entry.jobTitle || 'No position'}
                    </div>
                  </div>

                  {/* Interviewer & Date */}
                  <div style={{ marginRight: 16, textAlign: 'right' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--g3)' }}>
                      {entry.interviewer}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--g3)', fontFamily: 'var(--mono)' }}>
                      {entry.interviewDate ? new Date(entry.interviewDate).toLocaleDateString() : ''}
                    </div>
                  </div>

                  {/* Score */}
                  <div style={{
                    padding: '6px 16px',
                    borderRadius: 20,
                    background: `${getScoreColor(entry.score)}20`,
                    color: getScoreColor(entry.score),
                    fontWeight: 700,
                    fontSize: '1rem',
                    minWidth: 60,
                    textAlign: 'center',
                  }}>
                    {entry.score}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
