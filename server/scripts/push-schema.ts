/**
 * Database Schema
 * ─────────────────
 * Creates all required tables for HireFlow ATS
 * 
 * Run with: npm run db:push
 */

import { pool } from '../lib/db.js';

const schema = `
-- Drop existing tables (in reverse order)
DROP TABLE IF EXISTS ai_analysis_versions CASCADE;
DROP TABLE IF EXISTS skill_gap_analyses CASCADE;
DROP TABLE IF EXISTS activity_log CASCADE;
DROP TABLE IF EXISTS audit_log CASCADE;
DROP TABLE IF EXISTS emails CASCADE;
DROP TABLE IF EXISTS interviews CASCADE;
DROP TABLE IF EXISTS candidates CASCADE;
DROP TABLE IF EXISTS jobs CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users table (admins, recruiters, etc.)
CREATE TABLE users (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(255) NOT NULL,
  email       VARCHAR(255) NOT NULL UNIQUE,
  password    TEXT         NOT NULL,
  role        VARCHAR(50) NOT NULL DEFAULT 'recruiter',
  avatar      VARCHAR(500),
  created_at  TIMESTAMP   DEFAULT NOW(),
  updated_at  TIMESTAMP   DEFAULT NOW()
);

-- Jobs table
CREATE TABLE jobs (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title       VARCHAR(255) NOT NULL,
  dept        VARCHAR(100),
  type        VARCHAR(50),
  location    VARCHAR(255),
  status      VARCHAR(50) DEFAULT 'Open',
  applicants  INTEGER     DEFAULT 0,
  salary      VARCHAR(100),
  skills      TEXT,
  description TEXT,
  created_by  UUID        REFERENCES users(id),
  created_at  TIMESTAMP   DEFAULT NOW(),
  updated_at  TIMESTAMP   DEFAULT NOW()
);

-- Candidates table
CREATE TABLE candidates (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(255) NOT NULL,
  email       VARCHAR(255) NOT NULL,
  role        VARCHAR(255),
  stage       VARCHAR(50) DEFAULT 'Applied',
  stage_key   VARCHAR(50) DEFAULT 'Applied',
  source      VARCHAR(50),
  score       INTEGER,
  cv_text     TEXT,
  cv_url      TEXT,
  cv_filename TEXT,
  applied     VARCHAR(50),
  applied_at   TIMESTAMP,
  screening_at TIMESTAMP,
  interview_at TIMESTAMP,
  final_at     TIMESTAMP,
  offer_at     TIMESTAMP,
  hired_at     TIMESTAMP,
  rejected_at  TIMESTAMP,
  created_at  TIMESTAMP   DEFAULT NOW(),
  updated_at  TIMESTAMP   DEFAULT NOW()
);

-- Persisted skill-gap analyses (cached by application + job)
CREATE TABLE skill_gap_analyses (
  application_id TEXT      NOT NULL,
  job_id         TEXT      NOT NULL DEFAULT '',
  job_text_hash  TEXT      NOT NULL,
  cv_text_hash   TEXT      NOT NULL,
  result         JSONB     NOT NULL,
  created_at     TIMESTAMP DEFAULT NOW(),
  updated_at     TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (application_id, job_id)
);

-- Versioned AI results for audit/traceability
CREATE TABLE ai_analysis_versions (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id TEXT        NOT NULL,
  job_id         TEXT        DEFAULT '',
  analysis_type  VARCHAR(40) NOT NULL,
  version        VARCHAR(40) NOT NULL,
  input_hash     TEXT        NOT NULL,
  result         JSONB       NOT NULL,
  pii_redactions INTEGER     DEFAULT 0,
  created_at     TIMESTAMP   DEFAULT NOW()
);

-- Interviews table
CREATE TABLE interviews (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id  UUID        REFERENCES candidates(id) ON DELETE CASCADE,
  job_id        UUID        REFERENCES jobs(id) ON DELETE SET NULL,
  candidate     VARCHAR(255),
  role          VARCHAR(255),
  type          VARCHAR(50),
  date          DATE        NOT NULL,
  time          VARCHAR(10),
  duration      INTEGER,
  interviewers  VARCHAR(255),
  video_link    VARCHAR(500),
  notes         TEXT,
  status        VARCHAR(50) DEFAULT 'Scheduled',
  created_at    TIMESTAMP   DEFAULT NOW(),
  updated_at    TIMESTAMP   DEFAULT NOW()
);

-- Emails table
CREATE TABLE emails (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  from_name   VARCHAR(255),
  from_addr   VARCHAR(255),
  subject     VARCHAR(500),
  preview     TEXT,
  body        TEXT,
  time        VARCHAR(50),
  unread      BOOLEAN     DEFAULT false,
  created_at  TIMESTAMP   DEFAULT NOW()
);

-- Audit log table
CREATE TABLE audit_log (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  actor       VARCHAR(255),
  action      TEXT,
  details     JSONB,
  created_at  TIMESTAMP   DEFAULT NOW()
);

-- Activity log table
CREATE TABLE activity_log (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  color       VARCHAR(50),
  text        TEXT,
  created_at  TIMESTAMP   DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_candidates_email ON candidates(email);
CREATE INDEX idx_candidates_stage ON candidates(stage);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_interviews_date ON interviews(date);
CREATE INDEX idx_audit_log_created ON audit_log(created_at);
CREATE INDEX idx_skill_gap_updated ON skill_gap_analyses(updated_at);
CREATE INDEX idx_ai_analysis_app ON ai_analysis_versions(application_id);
CREATE INDEX idx_ai_analysis_type ON ai_analysis_versions(analysis_type);
`;

async function pushSchema() {
  console.log('[DB] Creating schema...');
  
  try {
    await pool.query(schema);
    console.log('[DB] Schema created successfully!');
  } catch (err) {
    console.error('[DB] Schema creation failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

pushSchema();
