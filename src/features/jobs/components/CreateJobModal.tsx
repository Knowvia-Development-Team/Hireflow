/**
 * CreateJobModal Component
 * ──────────────────
 * Modal for creating new job postings with shareable links
 */

import { useState, type FormEvent } from 'react';

interface Props {
  onClose: () => void;
  onCreate: (payload: any) => Promise<{ job: any; applyUrl: string }>;
}

export function CreateJobModal({ onClose, onCreate }: Props) {
  const [form, setForm] = useState({
    title: '',
    company: '',
    location: '',
    type: 'Full-time',
    description: '',
    requirements: '',
    salary_range: '',
    deadline: '',
  });
  const [applyUrl, setApplyUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Social media platforms
  const [socialPlatforms, setSocialPlatforms] = useState<string[]>([]);

  const handleSocialPlatformChange = (platform: string) => {
    setSocialPlatforms(prev =>
      prev.includes(platform)
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  };

  const handleChange = (
    e: FormEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.currentTarget;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await onCreate({
        ...form,
        social_media: socialPlatforms,
        created_by: localStorage.getItem('employerId') || undefined,
      });
      setApplyUrl(data.applyUrl);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(applyUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // After job is created, show the link panel
  if (applyUrl) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 text-center space-y-5">
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
          <h2 className="text-xl font-bold text-gray-900">Job Created!</h2>
          <p className="text-sm text-gray-500">
            Share this link with applicants. It will always point to this job's
            application form.
          </p>

          {/* The link box */}
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl p-3">
            <span className="text-sm text-indigo-700 font-mono flex-1 truncate text-left">
              {applyUrl}
            </span>
            <button
              onClick={copyLink}
              className="shrink-0 text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          </div>

          <div className="flex gap-3">
            <a
              href={applyUrl}
              target="_blank"
              rel="noreferrer"
              className="flex-1 text-sm text-center border border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Preview form
            </a>
            <button
              onClick={onClose}
              className="flex-1 text-sm bg-indigo-600 text-white px-4 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Job creation form
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-8 my-8 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Post a New Job</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-500 mb-1">
                Job Title *
              </label>
              <input
                required
                name="title"
                value={form.title}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g. Senior Frontend Developer"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">
                Company *
              </label>
              <input
                required
                name="company"
                value={form.company}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Company name"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">
                Location
              </label>
              <input
                name="location"
                value={form.location}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g. Remote / Harare"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">
                Type
              </label>
              <select
                name="type"
                value={form.type}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {['Full-time', 'Part-time', 'Contract', 'Remote', 'Internship'].map(
                  t => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  )
                )}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">
                Salary Range
              </label>
              <input
                name="salary_range"
                value={form.salary_range}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g. $800 – $1,200/mo"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">
                Application Deadline
              </label>
              <input
                type="date"
                name="deadline"
                value={form.deadline}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">
              Description *
            </label>
            <textarea
              required
              name="description"
              rows={4}
              value={form.description}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              placeholder="Describe the role and responsibilities..."
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">
              Requirements
            </label>
            <textarea
              name="requirements"
              rows={3}
              value={form.requirements}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              placeholder="List skills, qualifications, experience..."
            />
          </div>

          {/* Social Media Posting Section */}
          <div className="border-t border-gray-200 pt-4">
            <label className="block text-xs font-semibold text-gray-500 mb-3">
              Post to Social Media
            </label>
            <div className="flex flex-wrap gap-3">
              <label className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                socialPlatforms.includes('linkedin') 
                  ? 'border-blue-500 bg-blue-50 text-blue-700' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}>
                <input
                  type="checkbox"
                  checked={socialPlatforms.includes('linkedin')}
                  onChange={() => handleSocialPlatformChange('linkedin')}
                  className="sr-only"
                />
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                <span className="text-sm font-medium">LinkedIn</span>
              </label>

              <label className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                socialPlatforms.includes('twitter') 
                  ? 'border-black bg-gray-100 text-black' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}>
                <input
                  type="checkbox"
                  checked={socialPlatforms.includes('twitter')}
                  onChange={() => handleSocialPlatformChange('twitter')}
                  className="sr-only"
                />
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                <span className="text-sm font-medium">X / Twitter</span>
              </label>

              <label className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                socialPlatforms.includes('facebook') 
                  ? 'border-blue-600 bg-blue-50 text-blue-700' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}>
                <input
                  type="checkbox"
                  checked={socialPlatforms.includes('facebook')}
                  onChange={() => handleSocialPlatformChange('facebook')}
                  className="sr-only"
                />
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <span className="text-sm font-medium">Facebook</span>
              </label>

              <label className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                socialPlatforms.includes('indeed') 
                  ? 'border-blue-700 bg-blue-50 text-blue-800' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}>
                <input
                  type="checkbox"
                  checked={socialPlatforms.includes('indeed')}
                  onChange={() => handleSocialPlatformChange('indeed')}
                  className="sr-only"
                />
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 19.5c-4.142 0-7.5-3.358-7.5-7.5S7.858 4.5 12 4.5s7.5 3.358 7.5 7.5-3.358 7.5-7.5 7.5zm.75-12.75c.69 0 1.25.56 1.25 1.25s-.56 1.25-1.25 1.25S11 8.69 11.75 8s.56-1.25 1.25-1.25zm-4.5 7.5h9v1.5h-9v-1.5z"/>
                </svg>
                <span className="text-sm font-medium">Indeed</span>
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-60 transition-colors"
          >
            {loading ? 'Creating job...' : 'Create Job & Generate Link'}
          </button>
        </form>
      </div>
    </div>
  );
}
