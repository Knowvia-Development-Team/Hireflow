/**
 * Applications Hook
 * ──────────────────
 * React Query hooks for managing job applications
 */

import { useState, useEffect, useCallback } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface Application {
  id: string;
  job_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  linkedin_url: string | null;
  cover_letter: string | null;
  cv_url: string | null;
  cv_filename: string | null;
  status: 'new' | 'shortlisted' | 'rejected' | 'hired';
  notes: string | null;
  applied_at: string;
  updated_at: string;
}

export interface ApplicationCounts {
  new: number;
  shortlisted: number;
  rejected: number;
  hired: number;
}

interface UseApplicationsOptions {
  jobId: string | null;
  statusFilter?: string;
}

export function useApplicationsApi({ jobId, statusFilter = '' }: UseApplicationsOptions) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [counts, setCounts] = useState<ApplicationCounts>({
    new: 0,
    shortlisted: 0,
    rejected: 0,
    hired: 0
  });
  const [loading, setLoading] = useState(false);

  const fetchApplications = useCallback(async () => {
    if (!jobId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ job_id: jobId });
      if (statusFilter) params.set('status', statusFilter);
      
      const res = await fetch(`${API_URL}/api/applications?${params}`);
      const data = await res.json();
      setApplications(data.applications || []);
      setCounts(data.counts || {});
    } catch (err) {
      console.error('[Applications] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [jobId, statusFilter]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const updateStatus = async (id: string, status: string, notes?: string) => {
    const res = await fetch(`${API_URL}/api/applications/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, notes }),
    });
    const data = await res.json();
    setApplications(prev =>
      prev.map(a => a.id === id ? { ...a, ...data.application } : a)
    );
    await fetchApplications(); // refresh counts
  };

  const submitApplication = async (
    jobId: string,
    data: {
      full_name: string;
      email: string;
      phone?: string;
      linkedin_url?: string;
      cover_letter?: string;
    },
    cvFile?: File
  ): Promise<{ success: boolean; message: string }> => {
    const body = new FormData();
    body.append('job_id', jobId);
    body.append('full_name', data.full_name);
    body.append('email', data.email);
    if (data.phone) body.append('phone', data.phone);
    if (data.linkedin_url) body.append('linkedin_url', data.linkedin_url);
    if (data.cover_letter) body.append('cover_letter', data.cover_letter);
    if (cvFile) body.append('cv', cvFile);

    const res = await fetch(`${API_URL}/api/applications`, {
      method: 'POST',
      body,
    });
    
    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.error || 'Failed to submit application');
    }
    
    return { success: true, message: result.message };
  };

  return {
    applications,
    counts,
    loading,
    updateStatus,
    submitApplication,
    refresh: fetchApplications,
  };
}
