/**
 * JobsPage Component
 * ──────────────────
 * Employer dashboard for managing job postings
 */

import { useState, type MouseEvent } from 'react';
import { useJobsApi, type Job } from '../hooks/useJobsApi';
import { CreateJobModal } from './CreateJobModal';
import { ApplicantDrawer } from './ApplicantDrawer';

export function JobsPage() {
  const employerId = localStorage.getItem('employerId') || undefined;
  const { jobs, loading, createJob, toggleJob, deleteJob, refresh } = useJobsApi({
    employerId,
  });
  const [showCreate, setShowCreate] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const copyLink = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleCreateJob = async (payload: Partial<Job> & { created_by?: string }) => {
    const result = await createJob(payload);
    return result;
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Job Postings</h1>
          <p className="text-sm text-gray-500 mt-0.5">{jobs.length} active jobs</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-indigo-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
        >
          + Post a Job
        </button>
      </div>

      {/* Jobs grid */}
      {loading ? (
        <p className="text-sm text-gray-400">Loading jobs...</p>
      ) : jobs.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg">No jobs posted yet</p>
          <p className="text-sm mt-1">Click "Post a Job" to get started</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {jobs.map(job => (
            <div
              key={job.id}
              className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4 shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Job header */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-gray-900">{job.title}</h3>
                  <p className="text-sm text-gray-500">
                    {job.company} · {job.location || 'Remote'}
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ring-1 shrink-0 ${
                    job.is_active
                      ? 'bg-green-50 text-green-700 ring-green-200'
                      : 'bg-gray-50 text-gray-400 ring-gray-200'
                  }`}
                >
                  {job.is_active ? 'Active' : 'Closed'}
                </span>
              </div>

              {/* Stats row */}
              <div className="flex gap-4 text-center">
                {[
                  { label: 'Total', val: job.applicant_count || 0 },
                  { label: 'New', val: job.new_count || 0 },
                  { label: 'Shortlisted', val: job.shortlisted_count || 0 },
                ].map(s => (
                  <div
                    key={s.label}
                    className="flex-1 bg-gray-50 rounded-xl py-2"
                  >
                    <p className="text-lg font-bold text-gray-900">{s.val}</p>
                    <p className="text-xs text-gray-400">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Apply link */}
              <div className="flex items-center gap-2 bg-indigo-50 rounded-xl px-3 py-2">
                <span className="text-xs text-indigo-600 font-mono flex-1 truncate">
                  {job.applyUrl}
                </span>
                <button
                  onClick={() => copyLink(job.applyUrl, job.id)}
                  className="text-xs bg-indigo-600 text-white px-2.5 py-1 rounded-lg hover:bg-indigo-700 shrink-0"
                >
                  {copied === job.id ? '✓' : 'Copy'}
                </button>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedJob(job)}
                  className="flex-1 text-sm bg-gray-900 text-white px-3 py-2 rounded-xl hover:bg-gray-800 transition-colors"
                >
                  View Applicants ({job.applicant_count || 0})
                </button>
                <button
                  onClick={() => toggleJob(job.id, !job.is_active)}
                  className="text-sm border border-gray-200 text-gray-600 px-3 py-2 rounded-xl hover:bg-gray-50"
                >
                  {job.is_active ? 'Close' : 'Reopen'}
                </button>
                <button
                  onClick={() => {
                    if (window.confirm('Delete this job?'))
                      deleteJob(job.id);
                  }}
                  className="text-sm border border-red-100 text-red-500 px-3 py-2 rounded-xl hover:bg-red-50"
                >
                  Del
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {showCreate && (
        <CreateJobModal
          onClose={() => setShowCreate(false)}
          onCreate={handleCreateJob}
        />
      )}

      {selectedJob && (
        <ApplicantDrawer
          jobId={selectedJob.id}
          jobTitle={selectedJob.title}
          onClose={() => setSelectedJob(null)}
        />
      )}
    </div>
  );
}
