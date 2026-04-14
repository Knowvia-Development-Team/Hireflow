# HireFlow - Technical Requirements & Implementation Guide

**Version:** 1.0  
**Date:** March 27, 2026

---

## Table of Contents

1. [Overview](#overview)
2. [JWT Authentication](#jwt-authentication)
3. [AI CV Analysis Integration](#ai-cv-analysis-integration)
4. [Social Media Job Posting](#social-media-job-posting)
5. [Production Readiness Checklist](#production-readiness-checklist)
6. [Quick Start - What's Already Implemented](#quick-start---whats-already-implemented)

---

## Overview

HireFlow is an Applicant Tracking System (ATS) currently in **prototype phase**. This document outlines the technical requirements needed to transform it into a production-ready system with:

- Secure JWT-based authentication
- AI-powered CV analysis displayed on candidate screens
- Multi-platform social media job posting
- Real data handling (replacing dummy data)

---

## JWT Authentication

### What's Currently Implemented

| Component | Status |
|-----------|--------|
| Frontend Auth Store (Zustand) | ✅ Mock implementation |
| Login UI | ✅ Mock with pre-filled credentials |
| Role-based UI (Admin, Recruiter, etc.) | ✅ UI exists, not enforced |

### What's Missing

```
┌─────────────────────────────────────────────────────────────┐
│                    NEEDS IMPLEMENTATION                     │
├─────────────────────────────────────────────────────────────┤
│  ❌ Server-side JWT generation and validation               │
│  ❌ Password hashing (bcrypt)                                │
│  ❌ httpOnly refresh token cookies                          │
│  ❌ Auth middleware for protected routes                   │
│  ❌ User database table and model                           │
│  ❌ Real credential validation                              │
└─────────────────────────────────────────────────────────────┘
```

### Required Implementation

**1. Environment Variables** (add to `server/.env`):
```env
JWT_SECRET=your-secure-random-string-min-32-chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-secure-refresh-secret  
JWT_REFRESH_EXPIRES_IN=7d
```

**2. New Server Files Needed:**

| File | Purpose |
|------|---------|
| `server/routes/auth.ts` | POST /login, /refresh, /logout |
| `server/middleware/auth.ts` | Verify JWT tokens |
| `server/models/user.ts` | User schema |

**3. Dependencies:**
```bash
npm install jsonwebtoken bcryptjs
```

### Token Flow

```
User Login → Validate Credentials → Generate JWT (15min) + Refresh Token (7d)
     ↓
Access Token → Stored in memory (not localStorage)
Refresh Token → httpOnly cookie
     ↓
API Requests → Include "Authorization: Bearer <token>"
     ↓
Middleware → Verify JWT → Allow/Reject
```

---

## AI CV Analysis Integration

### What's Currently Implemented

The backend already has **complete AI analysis endpoints**:

| Endpoint | Model | Function |
|----------|-------|----------|
| `/api/analyse/extract` | Mistral-7B | Parse CV into structured data |
| `/api/analyse/match` | Mistral + MiniLM | Score candidate vs job |
| `/api/analyse/sentiment` | RoBERTa + BART | Analyze tone/quality |

**Frontend UI exists** at [`src/components/TextAnalysisModal.tsx`](src/components/TextAnalysisModal.tsx)
- ✅ Three analysis tabs (Extract, Match, Sentiment)
- ✅ Manual text/file input
- ✅ Rich result display

### The Gap

```
┌─────────────────────────────────────────────────────────────┐
│                      CURRENT STATE                          │
├─────────────────────────────────────────────────────────────┤
│  ✅ AI Routes exist and work                                │
│  ✅ Analysis Modal exists (standalone tool)                │
│  ❌ AI results NOT stored in database                      │
│  ❌ NOT displayed on Candidates screen                     │
│  ❌ NOT linked to actual applications                      │
└─────────────────────────────────────────────────────────────┘
```

### Required Implementation

**1. Database Changes** (add to `server/db/migrations.sql`):
```sql
-- Add AI analysis columns to applications table
ALTER TABLE applications ADD COLUMN extracted_data JSONB;
ALTER TABLE applications ADD COLUMN match_score INTEGER;
ALTER TABLE applications ADD COLUMN match_result JSONB;
ALTER TABLE applications ADD COLUMN sentiment_result JSONB;
ALTER TABLE applications ADD COLUMN ai_analyzed_at TIMESTAMPTZ;
```

**2. Application Flow**:
```
CV Uploaded → Call /api/analyse/extract → Store result in applications table
                  ↓
      Call /api/analyse/match → Store result (score, matched skills, etc.)
                  ↓
      Call /api/analyse/sentiment → Store result
                  ↓
Candidate Screen → Fetch stored AI results → Display on UI
```

**3. Frontend Updates Needed:**

| Component | Change |
|-----------|--------|
| `Candidate` type | Add extractedData, matchResult fields |
| `CandidateProfile` | Replace static skills with real match data |
| `Candidates.tsx` | Show AI analysis indicator |

**4. Auto-Analysis Trigger:**
- When new application/cv uploaded → automatically trigger AI pipeline
- Store results → display on candidate profile

### What AI Analysis Shows (Once Integrated)

**Extract Results:**
- Name, email, phone, location
- Skills array
- Education history
- Work experience
- Completeness score (0-100)

**Match Results:**
- Overall score (0-100)
- Matched skills ✓
- Missing skills ✗
- Interview questions generated
- Risk factors identified

**Sentiment Results:**
- Professional tone score
- Confidence score
- Writing quality
- Power words used
- Improvement tips

---

## Social Media Job Posting

### What's Currently Implemented

| Component | Status |
|-----------|--------|
| Job form `socialMedia` field | ❌ Exists but not used |
| CreateJobModal UI | ✅ Basic form |
| Job posting to database | ✅ Implemented |

### The Gap

```
┌─────────────────────────────────────────────────────────────┐
│                      CURRENT STATE                          │
├─────────────────────────────────────────────────────────────┤
│  ✅ Jobs can be created and saved                          │
│  ❌ No platform selection UI (LinkedIn, Twitter, etc.)      │
│  ❌ No backend API for posting to social platforms          │
│  ❌ No post status tracking                                 │
└─────────────────────────────────────────────────────────────┘
```

### Required Implementation

**1. Frontend UI Updates** (in `CreateJobModal`):

```
┌────────────────────────────────────────┐
│  Post to Social Media:                │
│  ☑ LinkedIn                           │
│  ☑ Twitter/X                          │
│  ☑ Facebook                           │
│  ☐ Indeed                             │
└────────────────────────────────────────┘
```

**2. Environment Variables Needed:**

```env
# LinkedIn
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=
LINKEDIN_ORGANIZATION_ID=

# Twitter/X
TWITTER_API_KEY=
TWITTER_API_SECRET=
TWITTER_ACCESS_TOKEN=
TWITTER_ACCESS_SECRET=

# Facebook
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=
FACEBOOK_PAGE_ID=

# Indeed
INDEED_PUBLISHER_ID=
```

**3. Backend Service Needed:**
- `server/services/social-media.ts` - Handle platform integrations
- Update `POST /api/jobs` to trigger social posts

**4. Feature Scope:**

| Feature | Description |
|---------|-------------|
| Multi-platform selection | Choose which platforms to post |
| Auto-post | Post when job goes live |
| Manual post | Delay posting |
| Post status | Track success/failure |
| Post URLs | Store links to created posts |
| Unpost | Remove posts when job closes |

---

## Production Readiness Checklist

### Phase 1: Authentication (Priority: HIGH)

- [ ] Implement server-side JWT authentication
- [ ] Add password hashing with bcrypt
- [ ] Create user database table
- [ ] Add httpOnly refresh token cookies
- [ ] Implement auth middleware
- [ ] Update login UI with real credentials

### Phase 2: Data Integration (Priority: HIGH)

- [ ] Connect frontend to backend API (replace dummy data)
- [ ] Migrate hardcoded data to database
- [ ] Implement full CRUD for jobs
- [ ] Implement full CRUD for candidates
- [ ] Implement applications workflow

### Phase 3: AI Integration (Priority: MEDIUM)

- [ ] Add AI columns to database
- [ ] Auto-trigger analysis on CV upload
- [ ] Store results in database
- [ ] Display on CandidateProfile
- [ ] Show on Candidates screen

### Phase 4: Social Media (Priority: MEDIUM)

- [ ] Add platform selection UI
- [ ] Implement LinkedIn integration
- [ ] Implement Twitter/X integration
- [ ] Implement Facebook integration
- [ ] Add post status tracking

### Phase 5: Security (Priority: HIGH)

- [ ] Implement PII encryption
- [ ] Secure CV file storage
- [ ] Add role-based access control
- [ ] GDPR/CCPA compliance
- [ ] Audit logging

---

## Quick Start - What's Already Implemented

### ✅ Completed Features

1. **History Page** - View rejected/hired candidates
2. **Interview Scores Page** - Save scores, leaderboard
3. **Database Schema** - Jobs, applications, interview_scores tables
4. **AI Backend Routes** - Extract, match, sentiment endpoints (work but not connected)
5. **Sidebar Navigation** - All pages linked

### 📋 Files Created

| File | Purpose |
|------|---------|
| `server/routes/history.ts` | History API |
| `server/routes/scores.ts` | Scores API |
| `server/db/migrations.sql` | DB schema updates |
| `src/components/HistoryPage.tsx` | History UI |
| `src/components/InterviewScoresPage.tsx` | Scores UI |

---

## Next Steps

To proceed with production readiness:

1. **Run database migrations** to create necessary tables
2. **Start with authentication** - implement JWT to secure the app
3. **Connect AI results** - store and display CV analysis
4. **Add social posting** - enable multi-platform job distribution

For detailed technical analysis, see [`plans/TECHNICAL_ANALYSIS.md`](plans/TECHNICAL_ANALYSIS.md)

---

*This document will be updated as features are implemented.*