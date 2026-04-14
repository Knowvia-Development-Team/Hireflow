/**
 * ApplyPage Component
 * ──────────────────
 * Public job application form - no auth required
 * Route: /apply/:slug
 */

import { useState, useEffect, type FormEvent, type ChangeEvent } from 'react';
import { usePublicJob, type Job } from '../hooks/useJobsApi';
import { useApplicationsApi } from '../hooks/useApplicationsApi';

function getSlugFromUrl(): string {
  // Parse /apply/:slug from URL
  const path = window.location.pathname;
  const match = path.match(/\/apply\/(.+)/);
  const slug: string = match?.[1] ?? '';
  return slug;
}

export function ApplyPage() {
  const [slug, setSlug] = useState('');
  const { job, loading: jobLoading, error: jobError } = usePublicJob(slug);
  const { submitApplication } = useApplicationsApi({ jobId: job?.id || null });

  useEffect(() => {
    setSlug(getSlugFromUrl());
  }, []);

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    linkedin_url: '',
    cover_letter: '',
  });
  const [cv, setCv] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [analysisScore, setAnalysisScore] = useState<number | null>(null);
  const [analysisWarnings, setAnalysisWarnings] = useState<string[]>([]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.currentTarget;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0] || null;
    setCv(file);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!job) return;

    setSubmitting(true);
    setSubmitError('');

    try {
      const result = await submitApplication(
        job.id,
        {
          full_name: form.full_name,
          email: form.email,
          phone: form.phone,
          linkedin_url: form.linkedin_url,
          cover_letter: form.cover_letter,
        },
        cv || undefined
      );
      setAnalysisScore(result.analysis?.fitScore ?? null);
      setAnalysisWarnings(result.warnings ?? []);
      setSubmitted(true);
    } catch (err: any) {
      setSubmitError(err.message || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Job not found
  if (jobError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-2">
          <p className="text-4xl">🚫</p>
          <h1 className="text-xl font-bold text-gray-800">Job Not Available</h1>
          <p className="text-gray-500 text-sm">{jobError}</p>
        </div>
      </div>
    );
  }

  // Loading
  if (jobLoading || !job) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Success
  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-2xl shadow-lg p-10 max-w-md w-full text-center space-y-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Application Sent!</h2>
          <p className="text-gray-500 text-sm">
            Thanks, <strong>{form.full_name}</strong>! Your application for{' '}
            <strong>{job.title}</strong> at {job.company} has been received.
            We'll be in touch.
          </p>
          {analysisScore !== null && (
            <div className="text-xs text-gray-500">
              Analysis complete — score {analysisScore}/100
            </div>
          )}
          {analysisWarnings.length > 0 && (
            <div className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
              {analysisWarnings[0]}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Application form
  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Job banner */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center text-xl font-bold text-indigo-700 shrink-0">
              {job.company[0]}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{job.title}</h1>
              <p className="text-sm text-gray-500">
                {job.company}
                {job.location ? ` · ${job.location}` : ''}
                {job.type ? ` · ${job.type}` : ''}
              </p>
              {job.salary_range && (
                <p className="text-sm text-green-600 font-medium mt-0.5">
                  {job.salary_range}
                </p>
              )}
              {job.deadline && (
                <p className="text-xs text-red-500 mt-1">
                  Deadline: {new Date(job.deadline).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>

          {job.description && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                {job.description}
              </p>
            </div>
          )}

          {job.requirements && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-400 uppercase mb-1">
                Requirements
              </p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                {job.requirements}
              </p>
            </div>
          )}
        </div>

        {/* Application form */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-5">
            Your Application
          </h2>

          {submitError && (
            <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg mb-4">
              {submitError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-semibold text-gray-500 mb-1">
                  Full Name *
                </label>
                <input
                  required
                  name="full_name"
                  value={form.full_name}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Jane Doe"
                />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-semibold text-gray-500 mb-1">
                  Email *
                </label>
                <input
                  required
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="jane@example.com"
                />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-semibold text-gray-500 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="+263 77 123 4567"
                />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-semibold text-gray-500 mb-1">
                  LinkedIn URL
                </label>
                <input
                  type="url"
                  name="linkedin_url"
                  value={form.linkedin_url}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="https://linkedin.com/in/..."
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">
                Cover Letter
              </label>
              <textarea
                name="cover_letter"
                rows={5}
                value={form.cover_letter}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                placeholder="Tell us why you're a great fit for this role..."
              />
            </div>

            {/* CV Upload */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">
                CV / Resume
              </label>
              <label className="flex items-center gap-3 border-2 border-dashed border-gray-200 rounded-xl p-4 cursor-pointer hover:border-indigo-300 hover:bg-indigo-50 transition-colors">
                <svg
                  className="w-6 h-6 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                  />
                </svg>
                <span className="text-sm text-gray-500 flex-1">
                  {cv ? cv.name : 'Attach PDF, DOC or DOCX (max 5MB)'}
                </span>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-60 transition-colors text-sm"
            >
              {submitting ? 'Submitting...' : 'Submit Application'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
