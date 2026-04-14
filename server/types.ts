// ── Shared backend types ──────────────────────────────────────────────────────

export interface ExtractRequestBody {
  text: string;
}

export interface MatchRequestBody {
  cvText:  string;
  jobText: string;
}

export interface SentimentRequestBody {
  text: string;
}

export interface SkillGapOptions {
  requiredWeight?: number;
  niceWeight?: number;
}

export interface SkillGapRequestBody {
  jobText: string;
  cvText: string;
  options?: SkillGapOptions;
  applicationId?: string;
  jobId?: string;
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
  fitScore: number;
  confidence: number;
  needsReview: boolean;
  explanations: string[];
  version: string;
  strengths: SkillGapStrength[];
  missing: SkillGapMissing[];
  summary: string[];
}

// ── HF Inference response shapes ─────────────────────────────────────────────

export interface HFTextClassificationItem {
  label: string;
  score: number;
}

export type HFTextClassificationResult =
  | HFTextClassificationItem
  | HFTextClassificationItem[]
  | HFTextClassificationItem[][];

export interface HFZeroShotResult {
  labels:  string[];
  scores:  number[];
  sequence?: string;
}

export interface HFTextGenResult {
  generated_text: string;
}

// ── Extracted CV data ─────────────────────────────────────────────────────────

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

// ── Job match data ────────────────────────────────────────────────────────────

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

export interface MistralMatchResult {
  cv_skills?:           string[];
  jd_skills?:           string[];
  matched_skills?:      string[];
  missing_skills?:      string[];
  bonus_skills?:        string[];
  qualitative_score?:   number;
  recommendation?:      string;
  summary?:             string;
  experience_fit?:      FitDetail;
  education_fit?:       FitDetail;
  interview_questions?: string[];
  risks?:               string[];
  culture_signals?:     string[];
}

export interface MatchResult extends MistralMatchResult {
  overall_score:   number;
  category_scores: CategoryScores;
  _meta: {
    semantic_score:    number;
    keyword_score:     number;
    qualitative_score: number;
    analysis_version:  string;
    pii_redactions:    number;
  };
}

// ── Sentiment data ────────────────────────────────────────────────────────────

export interface MistralWritingResult {
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
}

export interface SentimentResult extends MistralWritingResult {
  sentiment:  string;
  key_themes: string[];
  word_count: number;
  _meta?: {
    analysis_version: string;
    pii_redactions: number;
  };
}

// ── API response helpers ──────────────────────────────────────────────────────

export interface ApiSuccess<T> {
  success: true;
  data:    T;
}

export interface ApiError {
  error: string;
}
