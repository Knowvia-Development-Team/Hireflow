// =============================================================================
//  HireFlow — Shared Type Definitions
//  All domain types live here. Import with:  import type { Job } from '@/types'
// =============================================================================

// ── Authentication ────────────────────────────────────────────────────────────

export type UserRole = 'Admin' | 'Recruiter' | 'Interviewer' | 'Read-only';

// ── Jobs ──────────────────────────────────────────────────────────────────────

export type JobStatus = 'Open' | 'Draft' | 'Paused' | 'Closed';
export type JobType   = 'Full-time' | 'Part-time' | 'Contract';
export type LocationType = 'Remote' | 'Hybrid' | 'On-site';

export interface Job {
  id:              string;
  title:           string;
  dept:            string;
  type:            JobType;
  location:        string;
  status:          JobStatus;
  applicants:      number;
  salary:          string;
  skills:          string;
  desc:            string;
  created:         string;
  // Extended fields (optional for backwards compat)
  requirements?:   string;
  responsibilities?: string;
  experienceLevel?: 'Entry' | 'Mid' | 'Senior' | 'Lead' | 'Director';
  version?:        number;
  updatedAt?:      string;
}

// ── CV Pipeline ───────────────────────────────────────────────────────────────

export type PipelineStatus =
  | 'QUEUED' | 'EXTRACTING' | 'PARSING' | 'SCORING' | 'COMPLETE' | 'FAILED';

export interface CVUploadEvent {
  candidateId:  string;
  jobId:        string;
  fileKey:      string;
  fileName:     string;
  uploadedAt:   string;
  email?:       string;
  source?:      string;
}

export interface PipelineJob {
  id:            string;
  candidateId:   string;
  jobId:         string;
  status:        PipelineStatus;
  progress:      number;       // 0-100
  startedAt:     string;
  completedAt?:  string;
  errorMsg?:     string;
}

// ── WebSocket messages ────────────────────────────────────────────────────────

export type WSEventType =
  | 'CANDIDATE_NEW'
  | 'CANDIDATE_UPDATED'
  | 'PIPELINE_PROGRESS'
  | 'INTERVIEW_SCHEDULED'
  | 'EMAIL_SENT';

export interface WSMessage<T = unknown> {
  event:     WSEventType;
  payload:   T;
  timestamp: string;
}

// ── Interview automation ──────────────────────────────────────────────────────

export interface AutoScheduleResult {
  interviewId:   number;
  candidateId:   string;
  date:          string;
  time:          string;
  duration:      number;
  meetingLink:   string;
  emailSent:     boolean;
  emailLogId:    string;
}

export interface EmailLog {
  id:          string;
  to:          string;
  subject:     string;
  templateKey: string;
  variables:   Record<string, string>;
  status:      'SENT' | 'FAILED' | 'PENDING';
  sentAt?:     string;
  errorMsg?:   string;
}

// ── Candidates ────────────────────────────────────────────────────────────────

export type CandidateStageKey =
  | 'Applied' | 'Screening' | 'Interview'
  | 'Final'   | 'Offer'     | 'Rejected' | 'Hired';

export interface Candidate {
  id:       string;
  name:     string;
  email:    string;
  role:     string;
  stage:    string;      // display label, e.g. "Final Round"
  stageKey: CandidateStageKey;
  source:   string;
  score:    number;      // 0-100
  applied:  string;
  initials: string;
  createdAt?: string | null;
  appliedAt?: string | null;
  screeningAt?: string | null;
  interviewAt?: string | null;
  finalAt?: string | null;
  offerAt?: string | null;
  hiredAt?: string | null;
  rejectedAt?: string | null;
  // AI Analysis fields
  extractedData?: ExtractResult | null;
  matchResult?: MatchResult | null;
  sentimentResult?: SentimentResult | null;
  cvText?: string | null;
  cvUrl?: string | null;
  cvFilename?: string | null;
  skillGap?: SkillGapResult | null;
  aiAnalyzedAt?: string | null;
}

// ── Interview Scores ───────────────────────────────────────────────────────────

export interface InterviewScore {
  id:            string;
  candidateId:   string;
  candidateName: string;
  candidateEmail: string;
  jobId:         string;
  jobTitle:      string;
  score:         number;
  interviewer:   string;
  comments:      string | null;
  interviewDate: string;
  createdAt:     string;
}

export interface LeaderboardEntry extends InterviewScore {
  rank: number;
}

// ── History Records ────────────────────────────────────────────────────────────

export interface HistoryRecord {
  id:        string;
  name:      string;
  email:     string;
  status:    'rejected' | 'hired';
  jobTitle:  string;
  jobId:     string;
  appliedAt: string;
  decidedAt: string;
}

// ── Interviews ────────────────────────────────────────────────────────────────

export type InterviewType   = 'Screening' | 'Technical' | 'Final' | 'Culture';
export type InterviewStatus = 'Scheduled' | 'Completed' | 'Cancelled' | 'No-show';

export interface Interview {
  id:           string;
  candidate:    string;
  role:         string;
  type:         InterviewType;
  date:         string;   // ISO YYYY-MM-DD
  time:         string;   // HH:MM
  duration:     number;   // minutes
  interviewers: string;
  videoLink:    string;
  notes:        string;
  status:       InterviewStatus;
}

// ── Emails ────────────────────────────────────────────────────────────────────

export interface Email {
  id:      string;
  from:    string;
  addr:    string;
  subject: string;
  preview: string;
  time:    string;
  unread:  boolean;
  body:    string;
}

// ── Activity / Audit ──────────────────────────────────────────────────────────

export interface ActivityItem {
  color: string;
  text:  string;
  time:  string;
}

export interface AuditEntry {
  actor:  string;
  action: string;
  time:   string;
}

// ── Toast system ──────────────────────────────────────────────────────────────

export type ToastColor = 'green' | 'blue' | 'amber';

export interface Toast {
  id:      number;
  title:   string;
  msg:     string;
  color:   ToastColor;
  leaving: boolean;
}

// ── Navigation ────────────────────────────────────────────────────────────────

export type ViewId =
  | 'dashboard' | 'candidates' | 'profile'
  | 'jobs'      | 'schedule'   | 'connections' | 'settings'
  | 'history'   | 'scores';

export type ModalId =
  | 'new-job' | 'add-cand' | 'schedule' | 'ai-analyse' | null;

// ── Form payloads (modal submit data) ────────────────────────────────────────

export interface NewJobFormData {
  title:    string;
  dept:     string;
  type:     string;
  location: string;
  desc:     string;
  skills:   string;
  socialMedia: string[];
  flyer:    File | null;
}

export interface NewCandidateFormData {
  fname:  string;
  lname:  string;
  email:  string;
  source: string;
}

export interface NewInterviewFormData {
  candidate:    string;
  type:         string;
  date:         string;
  time:         string;
  duration:     number | string;
  interviewers: string;
  notes:        string;
}

export interface PortalFormData {
  fname:     string;
  lname:     string;
  email:     string;
  phone:     string;
  location:  string;
  linkedin:  string;
  portfolio: string;
  cover:     string;
  source:    string;
  cvText?:   string;
  cvUrl?:    string | null;
  cvFilename?: string | null;
}

// ── AI Analysis (Hugging Face backend responses) ─────────────────────────────

export interface ExtractedEducation {
  degree:      string;
  institution: string;
  year:        string;
}

export interface ExtractedExperience {
  role:       string;
  company:    string;
  duration:   string;
  highlights: string[];
}

export interface ExtractResult {
  name?:               string | null;
  email?:              string | null;
  phone?:              string | null;
  location?:           string | null;
  title?:              string | null;
  summary?:            string | null;
  experience_years?:   number | null;
  skills?:             string[];
  languages?:          string[];
  education?:          ExtractedEducation[];
  experience?:         ExtractedExperience[];
  certifications?:     string[];
  completeness_score?: number;
  completeness_notes?: string;
  strengths?:          string[];
  red_flags?:          string[];
  _meta?: {
    analysis_version: string;
    pii_redactions: number;
  };
}

export interface CategoryScores {
  skills:      number;
  experience:  number;
  education:   number;
  soft_skills: number;
}

export interface FitDetail {
  score: number;
  note:  string;
}

export interface MatchResult {
  overall_score?:       number;
  recommendation?:      string;
  summary?:             string;
  matched_skills?:      string[];
  missing_skills?:      string[];
  bonus_skills?:        string[];
  experience_fit?:      FitDetail;
  education_fit?:       FitDetail;
  culture_signals?:     string[];
  interview_questions?: string[];
  risks?:               string[];
  category_scores?:     CategoryScores;
  _meta?: {
    semantic_score?: number;
    keyword_score?: number;
    qualitative_score?: number;
    analysis_version?: string;
    pii_redactions?: number;
  };
}

export interface SentimentResult {
  sentiment?:             string;
  overall_tone?:          string;
  tone_score?:            number;
  clarity_score?:         number;
  confidence_score?:      number;
  professionalism_score?: number;
  writing_quality_score?: number;
  power_words?:           string[];
  weak_phrases?:          string[];
  action_verbs?:          string[];
  improvement_tips?:      string[];
  standout_sentence?:     string | null;
  readability?:           string;
  key_themes?:            string[];
  word_count?:            number;
  _meta?: {
    analysis_version: string;
    pii_redactions: number;
  };
}

export interface SkillGapStrength {
  skill: string;
  evidence: string[];
}

export interface SkillGapMissing {
  skill: string;
  reason: string;
}

export interface SkillGapResult {
  fitScore: number; // 0-100
  confidence: number;
  needsReview: boolean;
  explanations: string[];
  version: string;
  strengths: SkillGapStrength[];
  missing: SkillGapMissing[];
  summary: string[]; // 3-6 bullets
}

export type AnalysisResultData = ExtractResult | MatchResult | SentimentResult | SkillGapResult;

export interface AnalysisResult {
  type: 'extract' | 'match' | 'sentiment' | 'skill-gap';
  data: AnalysisResultData;
}

// ── API response wrappers ─────────────────────────────────────────────────────

export interface ApiSuccess<T> {
  success: true;
  data:    T;
}

export interface ApiError {
  error: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;
