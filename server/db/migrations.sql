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
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'created_by') THEN
        ALTER TABLE jobs ADD COLUMN created_by UUID;
    END IF;
END $$;
