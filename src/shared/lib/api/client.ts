/**
 * API Client
 * ───────────
 * Frontend interface to the HireFlow backend API
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Custom error class for API errors
export class ApiError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

// Network error class
export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

// Token management
let accessToken: string | null = null;
let refreshPromise: Promise<string | null> | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

// Generic API client for making requests
export const apiClient = {
  get: <T>(endpoint: string, options?: RequestInit): Promise<T> => request(endpoint, options),
  post: <T>(endpoint: string, body: unknown, options?: RequestInit): Promise<T> =>
    request(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) }),
  put: <T>(endpoint: string, body: unknown, options?: RequestInit): Promise<T> =>
    request(endpoint, { ...options, method: 'PUT', body: JSON.stringify(body) }),
  delete: <T>(endpoint: string, options?: RequestInit): Promise<T> =>
    request(endpoint, { ...options, method: 'DELETE' }),
};

type RequestInitWithRetry = RequestInit & { _authRetry?: boolean };

async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (!res.ok) return null;
      const json = await res.json().catch(() => null);
      const token = (json?.data?.accessToken ?? json?.accessToken) as string | undefined;
      if (token) setAccessToken(token);
      return token ?? null;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}

async function request<T>(endpoint: string, options?: RequestInitWithRetry): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const token = getAccessToken();
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
    credentials: 'include',
  });

  if (response.status === 401 && !options?._authRetry) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      return request<T>(endpoint, { ...options, _authRetry: true });
    }
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  if (response.status === 204) {
    return null as T;
  }

  return response.json();
}

// Direct HTTP method exports for convenience
export const get = <T>(endpoint: string, options?: RequestInit): Promise<T> => request(endpoint, options);
export const post = <T>(endpoint: string, body: unknown, options?: RequestInit): Promise<T> =>
  request(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) });
export const put = <T>(endpoint: string, body: unknown, options?: RequestInit): Promise<T> =>
  request(endpoint, { ...options, method: 'PUT', body: JSON.stringify(body) });
export const del = <T>(endpoint: string, options?: RequestInit): Promise<T> =>
  request(endpoint, { ...options, method: 'DELETE' });
// Alias for delete since 'delete' is a reserved word
export { del as delete };

// ─────────────────────────────────────────────────────────────
// Jobs API
// ─────────────────────────────────────────────────────────────

export const jobsApi = {
  getAll: () => request('/api/data/jobs'),
  getById: (id: string) => request(`/api/data/jobs/${id}`),
  create: (job: Partial<Job>) => request('/api/data/jobs', { method: 'POST', body: JSON.stringify(job) }),
  update: (id: string, job: Partial<Job>) => request(`/api/data/jobs/${id}`, { method: 'PUT', body: JSON.stringify(job) }),
  delete: (id: string) => request(`/api/data/jobs/${id}`, { method: 'DELETE' }),
};

// ─────────────────────────────────────────────────────────────
// Candidates API
// ─────────────────────────────────────────────────────────────

export const candidatesApi = {
  getAll: () => request('/api/data/candidates'),
  getById: (id: string) => request(`/api/data/candidates/${id}`),
  create: (candidate: Partial<Candidate>) => request('/api/data/candidates', { method: 'POST', body: JSON.stringify(candidate) }),
  update: (id: string, candidate: Partial<Candidate>) => request(`/api/data/candidates/${id}`, { method: 'PUT', body: JSON.stringify(candidate) }),
  delete: (id: string) => request(`/api/data/candidates/${id}`, { method: 'DELETE' }),
};

// ─────────────────────────────────────────────────────────────
// Interviews API
// ─────────────────────────────────────────────────────────────

export const interviewsApi = {
  getAll: () => request('/api/data/interviews'),
  create: (interview: Partial<Interview>) => request('/api/data/interviews', { method: 'POST', body: JSON.stringify(interview) }),
  update: (id: number, interview: Partial<Interview>) => request(`/api/data/interviews/${id}`, { method: 'PUT', body: JSON.stringify(interview) }),
};

// ─────────────────────────────────────────────────────────────
// Emails API
// ─────────────────────────────────────────────────────────────

export const emailsApi = {
  getAll: () => request('/api/data/emails'),
  markRead: (id: string, unread: boolean) => request(`/api/data/emails/${id}`, { method: 'PUT', body: JSON.stringify({ unread }) }),
};

// ─────────────────────────────────────────────────────────────
// Audit & Activity API
// ─────────────────────────────────────────────────────────────

export const auditApi = {
  getAll: () => request('/api/data/audit'),
  create: (entry: { actor: string; action: string }) => request('/api/data/audit', { method: 'POST', body: JSON.stringify(entry) }),
};

export const activityApi = {
  getAll: () => request('/api/data/activity'),
  create: (entry: { color: string; text: string }) => request('/api/data/activity', { method: 'POST', body: JSON.stringify(entry) }),
};

// ─────────────────────────────────────────────────────────────
// Search API
// ─────────────────────────────────────────────────────────────

export interface SearchResults {
  candidates: Candidate[];
  jobs: Job[];
  emails: Email[];
}

export const searchApi = {
  search: (query: string) => request<SearchResults>(`/api/data/search?q=${encodeURIComponent(query)}`),
};

// ─────────────────────────────────────────────────────────────
// Types (matching backend)
// ─────────────────────────────────────────────────────────────

export interface Job {
  id: string;
  title: string;
  dept: string;
  type: string;
  location: string;
  status: string;
  applicants: number;
  salary: string;
  skills: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  role: string;
  stage: string;
  stage_key: string;
  source: string;
  score: number;
  cv_text?: string;
  applied: string;
  initials: string;
  created_at: string;
  updated_at: string;
}

export interface Interview {
  id: string;
  candidate_id?: string;
  job_id?: string;
  candidate: string;
  role: string;
  type: string;
  date: string;
  time: string;
  duration: number;
  interviewers: string;
  video_link: string;
  notes: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Email {
  id: string;
  from_name: string;
  from_addr: string;
  subject: string;
  preview: string;
  body: string;
  time: string;
  unread: boolean;
  created_at: string;
}

export interface AuditEntry {
  id: string;
  actor: string;
  action: string;
  details: Record<string, unknown> | null;
  created_at: string;
}

export interface ActivityItem {
  id: string;
  color: string;
  text: string;
  created_at: string;
}
