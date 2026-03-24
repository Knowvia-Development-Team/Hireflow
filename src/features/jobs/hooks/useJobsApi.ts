/**
 * Jobs Hook
 * ──────────────────
 * React Query hooks for job management
 */

import { useState, useEffect, useCallback } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface Job {
  id: string;
  slug: string;
  title: string;
  company: string;
  location: string | null;
  type: string;
  description: string;
  requirements: string | null;
  salary_range: string | null;
  deadline: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  applyUrl: string;
  applicant_count: number;
  new_count: number;
  shortlisted_count: number;
}

interface UseJobsOptions {
  employerId?: string;
}

export function useJobsApi({ employerId }: UseJobsOptions = {}) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const params = employerId ? `?created_by=${employerId}` : '';
      const res = await fetch(`${API_URL}/api/jobs${params}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setJobs(data.jobs || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [employerId]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const createJob = async (payload: Partial<Job> & { created_by?: string }) => {
    const res = await fetch(`${API_URL}/api/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    setJobs(prev => [data.job, ...prev]);
    return data; // { job, applyUrl }
  };

  const toggleJob = async (id: string, is_active: boolean) => {
    const res = await fetch(`${API_URL}/api/jobs/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active }),
    });
    const data = await res.json();
    setJobs(prev => prev.map(j => j.id === id ? { ...j, ...data.job } : j));
  };

  const deleteJob = async (id: string) => {
    await fetch(`${API_URL}/api/jobs/${id}`, { method: 'DELETE' });
    setJobs(prev => prev.filter(j => j.id !== id));
  };

  return { 
    jobs, 
    loading, 
    error, 
    createJob, 
    toggleJob, 
    deleteJob, 
    refresh: fetchJobs 
  };
}

export function usePublicJob(slug: string) {
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    
    setLoading(true);
    fetch(`${API_URL}/api/jobs/public/${slug}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error);
        else setJob(d.job);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [slug]);

  return { job, loading, error };
}
