/**
 * ApplicantDrawer Component
 * ──────────────────
 * Slide-in panel showing all applicants for a selected job
 */

import { useState, type MouseEvent } from 'react';
import { useApplicationsApi, type Application } from '../hooks/useApplicationsApi';

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-50 text-blue-700 ring-blue-200',
  shortlisted: 'bg-green-50 text-green-700 ring-green-200',
  rejected: 'bg-red-50 text-red-600 ring-red-200',
  hired: 'bg-purple-50 text-purple-700 ring-purple-200',
};

interface Props {
  jobId: string;
  jobTitle: string;
  onClose: () => void;
}

export function ApplicantDrawer({ jobId, jobTitle, onClose }: Props) {
  const [statusFilter, setStatusFilter] = useState('');
  const { applications, counts, loading, updateStatus, refresh } = useApplicationsApi({
    jobId,
    statusFilter,
  });

  const handleFilterChange = (status: string) => (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setStatusFilter(status);
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/40" onClick={onClose} />

      {/* Drawer */}
      <div className="w-full max-w-2xl bg-white shadow-2xl flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Applicants</h2>
              <p className="text-sm text-gray-500">{jobTitle}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-xl"
            >
              ✕
            </button>
          </div>

          {/* Status counts */}
          <div className="flex gap-2 flex-wrap">
            {(['', 'new', 'shortlisted', 'hired', 'rejected'] as const).map(s => (
              <button
                key={s}
                onClick={handleFilterChange(s)}
                className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                  statusFilter === s
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {s === ''
                  ? `All (${Object.values(counts).reduce((a, b) => a + b, 0)})`
                  : `${s} (${counts[s as keyof typeof counts] || 0})`}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
          {loading && (
            <div className="flex items-center justify-center h-32 text-sm text-gray-400">
              Loading applicants...
            </div>
          )}

          {!loading && applications.length === 0 && (
            <div className="flex flex-col items-center justify-center h-32 text-gray-400">
              <p className="text-sm">No applicants yet</p>
            </div>
          )}

          {applications.map(app => (
            <ApplicantRow
              key={app.id}
              app={app}
              onStatusChange={updateStatus}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface ApplicantRowProps {
  app: Application;
  onStatusChange: (id: string, status: string) => Promise<void>;
}

function ApplicantRow({ app, onStatusChange }: ApplicantRowProps) {
  const [expanded, setExpanded] = useState(false);
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  const handleStatusChange = async (e: FormEvent<HTMLSelectElement>) => {
    const newStatus = e.currentTarget.value;
    await onStatusChange(app.id, newStatus);
  };

  return (
    <div className="px-6 py-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-semibold text-sm shrink-0">
          {app.full_name[0]?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900">{app.full_name}</p>
          <p className="text-xs text-gray-500">
            {app.email}
            {app.phone ? ` · ${app.phone}` : ''}
          </p>
          {app.linkedin_url && (
            <a
              href={app.linkedin_url}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-indigo-600 hover:underline"
            >
              LinkedIn
            </a>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* Status badge + changer */}
          <select
            value={app.status}
            onChange={handleStatusChange}
            className={`text-xs px-2 py-1 rounded-full ring-1 border-0 font-medium cursor-pointer ${STATUS_COLORS[app.status]}`}
          >
            <option value="new">New</option>
            <option value="shortlisted">Shortlisted</option>
            <option value="rejected">Rejected</option>
            <option value="hired">Hired</option>
          </select>

          {/* CV download */}
          {app.cv_url && (
            <a
              href={`${API_URL}${app.cv_url}`}
              target="_blank"
              rel="noreferrer"
              className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-lg hover:bg-gray-200 transition-colors"
              title={app.cv_filename || 'Download CV'}
            >
              CV ↓
            </a>
          )}

          <button
            onClick={() => setExpanded(e => !e)}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            {expanded ? '▲' : '▼'}
          </button>
        </div>
      </div>

      {/* Expanded: cover letter */}
      {expanded && app.cover_letter && (
        <div className="ml-12 text-xs text-gray-600 bg-gray-50 rounded-lg p-3 whitespace-pre-wrap">
          {app.cover_letter}
        </div>
      )}

      <p className="ml-12 text-xs text-gray-400">
        Applied {new Date(app.applied_at).toLocaleDateString()}
      </p>
    </div>
  );
}
