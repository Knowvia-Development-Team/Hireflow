-- ═════════════════════════════════════════════════════════════════════
-- HireFlow Job Application System - Database Migrations
-- Run: psql -d hireflow -f server/db/migrations.sql
-- ═════════════════════════════════════════════════════════════════════

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Jobs table - stores job postings with unique shareable links
CREATE TABLE IF NOT EXISTS jobs (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug          VARCHAR(12) UNIQUE NOT NULL,       -- short unique token for public URL
    title         TEXT NOT NULL,
    company       TEXT NOT NULL,
    location      TEXT,
    type          TEXT DEFAULT 'Full-time',           -- Full-time, Part-time, Contract, Remote
    description   TEXT NOT NULL,
    requirements  TEXT,
    salary_range  TEXT,
    deadline      DATE,
    is_active     BOOLEAN DEFAULT TRUE,
    created_by    UUID,                               -- FK to your users/employers table
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Applications table - stores job applications
CREATE TABLE IF NOT EXISTS applications (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id          UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    full_name       TEXT NOT NULL,
    email           TEXT NOT NULL,
    phone           TEXT,
    linkedin_url    TEXT,
    cover_letter    TEXT,
    cv_url          TEXT,                             -- path to uploaded file
    cv_filename     TEXT,
    status          TEXT DEFAULT 'new',               -- new | shortlisted | rejected | hired
    notes           TEXT,                             -- employer internal notes
    applied_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(job_id, email)                             -- prevent duplicate applications
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_applications_job_id ON applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_jobs_slug ON jobs(slug);
CREATE INDEX IF NOT EXISTS idx_jobs_created_by ON jobs(created_by);

-- Add slug column to existing jobs table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'slug') THEN
        ALTER TABLE jobs ADD COLUMN slug VARCHAR(12) UNIQUE;
    END IF;
END $$;

-- Add is_active column to existing jobs table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'is_active') THEN
        ALTER TABLE jobs ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    END IF;
END $$;

-- Add created_by column to existing jobs table if it doesn't exist
DO $
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'created_by') THEN
        ALTER TABLE jobs ADD COLUMN created_by UUID;
    END IF;
END $;

-- ═════════════════════════════════════════════════════════════════════
-- Interview Scores table - stores interview evaluation scores
-- ═════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS interview_scores (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id    UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    job_id          UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    score           INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
    interviewer     TEXT NOT NULL,
    comments        TEXT,
    interview_date  DATE NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast lookups on interview_scores
CREATE INDEX IF NOT EXISTS idx_interview_scores_candidate_id ON interview_scores(candidate_id);
CREATE INDEX IF NOT EXISTS idx_interview_scores_job_id ON interview_scores(job_id);
CREATE INDEX IF NOT EXISTS idx_interview_scores_score ON interview_scores(score DESC);

-- Add rejected_at column to track when candidate was rejected
DO $
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applications' AND column_name = 'rejected_at') THEN
        ALTER TABLE applications ADD COLUMN rejected_at TIMESTAMPTZ;
    END IF;
END $;

-- Add hired_at column to track when candidate was hired
DO $
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applications' AND column_name = 'hired_at') THEN
        ALTER TABLE applications ADD COLUMN hired_at TIMESTAMPTZ;
    END IF;
END $;

-- Add CV file columns to candidates table if missing
DO $
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'candidates') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'candidates' AND column_name = 'cv_url') THEN
            ALTER TABLE candidates ADD COLUMN cv_url TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'candidates' AND column_name = 'cv_filename') THEN
            ALTER TABLE candidates ADD COLUMN cv_filename TEXT;
        END IF;
    END IF;
END $;

-- ═════════════════════════════════════════════════════════════════════
-- Users table - stores authentication credentials
-- ═════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email       TEXT NOT NULL UNIQUE,
    password    TEXT NOT NULL,                    -- bcrypt hashed
    name        TEXT NOT NULL,
    role        TEXT NOT NULL DEFAULT 'Recruiter', -- Admin, Recruiter, Interviewer, Read-only
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast user lookup
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Add social media columns to jobs table
DO $
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'social_media') THEN
        ALTER TABLE jobs ADD COLUMN social_media TEXT[] DEFAULT '{}';
    END IF;
END $;

DO $
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'social_post_status') THEN
        ALTER TABLE jobs ADD COLUMN social_post_status JSONB DEFAULT '{}';
    END IF;
END $;

-- Add AI analysis columns to applications table
DO $
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applications' AND column_name = 'extracted_data') THEN
        ALTER TABLE applications ADD COLUMN extracted_data JSONB;
    END IF;
END $;

DO $
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applications' AND column_name = 'match_score') THEN
        ALTER TABLE applications ADD COLUMN match_score INTEGER;
    END IF;
END $;

DO $
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applications' AND column_name = 'match_result') THEN
        ALTER TABLE applications ADD COLUMN match_result JSONB;
    END IF;
END $;

DO $
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applications' AND column_name = 'sentiment_result') THEN
        ALTER TABLE applications ADD COLUMN sentiment_result JSONB;
    END IF;
END $;

DO $
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applications' AND column_name = 'ai_analyzed_at') THEN
        ALTER TABLE applications ADD COLUMN ai_analyzed_at TIMESTAMPTZ;
    END IF;
END $;

-- Insert default admin user (password: admin123)
-- Note: In production, use a more secure default password and force change on first login
DO $
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@hireflow.io') THEN
        INSERT INTO users (email, password, name, role)
        VALUES (
            'admin@hireflow.io',
            '$2a$10$rQZ8K8V3XH5J9Z5K8V3XH5J9Z5K8V3XH5J9Z5K8V3XH5J9Z5K8V3XH', -- hash of 'admin123'
            'Admin User',
            'Admin'
        );
    END IF;
END $;
