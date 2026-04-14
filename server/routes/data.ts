/**
 * Data API Routes
 * ─────────────────
 * RESTful API for all HireFlow data operations
 * 
 * Endpoints:
 *   GET    /api/data/jobs        - List all jobs
 *   POST   /api/data/jobs        - Create job
 *   GET    /api/data/jobs/:id    - Get job by ID
 *   PUT    /api/data/jobs/:id    - Update job
 *   DELETE /api/data/jobs/:id    - Delete job
 * 
 *   GET    /api/data/candidates - List all candidates
 *   POST   /api/data/candidates - Create candidate
 *   GET    /api/data/candidates/:id - Get candidate
 *   PUT    /api/data/candidates/:id - Update candidate
 *   DELETE /api/data/candidates/:id - Delete candidate
 * 
 *   GET    /api/data/interviews - List all interviews
 *   POST   /api/data/interviews - Create interview
 *   PUT    /api/data/interviews/:id - Update interview
 * 
 *   GET    /api/data/emails     - List all emails
 *   PUT    /api/data/emails/:id - Mark email as read
 * 
 *   GET    /api/data/audit      - Get audit log
 *   GET    /api/data/activity   - Get activity log
 */

import { Router, type Request, type Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { query, execute } from '../lib/db.js';
import { isMemoryDb } from '../lib/runtime.js';

const router = Router();

// ---------------------------------------------------------------------------
// USERS (Team Members)
// ---------------------------------------------------------------------------

let memoryUsers = (() => {
  const email = process.env.DEV_AUTH_EMAIL || 'mika.sato@northgrid.io';
  const name = process.env.DEV_AUTH_NAME || 'Mika Sato';
  const role = process.env.DEV_AUTH_ROLE || 'Admin';
  return [
    { id: process.env.DEV_AUTH_ID || '00000000-0000-0000-0000-000000000001', name, email, role, created_at: new Date().toISOString() },
    { id: '00000000-0000-0000-0000-000000000002', name: 'Ari Kunda', email: 'ari.kunda@northgrid.io', role: 'Recruiter', created_at: new Date().toISOString() },
    { id: '00000000-0000-0000-0000-000000000003', name: 'Lena Okafor', email: 'lena.okafor@northgrid.io', role: 'Interviewer', created_at: new Date().toISOString() },
    { id: '00000000-0000-0000-0000-000000000004', name: 'Devon Hale', email: 'devon.hale@northgrid.io', role: 'Read-only', created_at: new Date().toISOString() },
  ];
})();

const normalizeRole = (role: string | undefined): string => {
  if (!role) return 'Recruiter';
  const r = role.toLowerCase().replace(/_/g, '-');
  if (r === 'admin') return 'Admin';
  if (r === 'recruiter') return 'Recruiter';
  if (r === 'interviewer') return 'Interviewer';
  if (r === 'read-only' || r === 'readonly') return 'Read-only';
  return role;
};

const generateTempPassword = (): string => {
  const token = crypto.randomBytes(6).toString('base64url');
  return `Hire-${token}`;
};

router.get('/users', async (_req: Request, res: Response): Promise<void> => {
  try {
    if (isMemoryDb) {
      res.json(memoryUsers);
      return;
    }
    const users = await query('SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

router.post('/users', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, role } = req.body as { name?: string; email?: string; role?: string };
    if (!name || !email) {
      res.status(400).json({ error: 'Name and email are required' });
      return;
    }
    const normalizedRole = normalizeRole(role);
    const tempPassword = generateTempPassword();
    const passwordHash = bcrypt.hashSync(tempPassword, 10);

    if (isMemoryDb) {
      if (memoryUsers.some(u => u.email.toLowerCase() === email.toLowerCase())) {
        res.status(409).json({ error: 'User already exists' });
        return;
      }
      const newUser = {
        id: crypto.randomUUID(),
        name,
        email,
        role: normalizedRole,
        created_at: new Date().toISOString(),
      };
      memoryUsers = [newUser, ...memoryUsers];
      res.status(201).json({ user: newUser, tempPassword });
      return;
    }

    try {
      const result = await query(
        `INSERT INTO users (name, email, password, role)
         VALUES ($1, $2, $3, $4)
         RETURNING id, name, email, role, created_at`,
        [name, email, passwordHash, normalizedRole]
      );
      res.status(201).json({ user: result[0], tempPassword });
    } catch (err: any) {
      if (err?.code === '23505') {
        res.status(409).json({ error: 'User already exists' });
        return;
      }
      res.status(500).json({ error: 'Failed to create user' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// ─────────────────────────────────────────────────────────────
// JOBS
// ─────────────────────────────────────────────────────────────

router.get('/jobs', async (_req: Request, res: Response): Promise<void> => {
  try {
    const jobs = await query('SELECT * FROM jobs ORDER BY created_at DESC');
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

router.post('/jobs', async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, dept, type, location, status, salary, skills, description } = req.body;
    const result = await query(
      `INSERT INTO jobs (title, dept, type, location, status, salary, skills, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [title, dept, type, location, status || 'Open', salary, skills, description]
    );
    res.status(201).json(result[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create job' });
  }
});

router.get('/jobs/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const job = await query('SELECT * FROM jobs WHERE id = $1', [req.params.id]);
    if (job.length === 0) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }
    res.json(job[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch job' });
  }
});

router.put('/jobs/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, dept, type, location, status, salary, skills, description, applicants } = req.body;
    const current = await query('SELECT id, title, status FROM jobs WHERE id = $1', [req.params.id]);
    const currentJob = current[0] ?? null;
    const result = await query(
      `UPDATE jobs SET title=$1, dept=$2, type=$3, location=$4, status=$5, salary=$6, skills=$7, description=$8, applicants=$9, updated_at=NOW()
       WHERE id=$10 RETURNING *`,
      [title, dept, type, location, status, salary, skills, description, applicants, req.params.id]
    );
    if (result.length === 0) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }
    if (currentJob && status === 'Closed' && currentJob.status !== 'Closed') {
      await query(
        `UPDATE candidates
         SET stage='Screening', stage_key='Screening', screening_at=COALESCE(screening_at, NOW()), updated_at=NOW()
         WHERE role = $1 AND stage_key = 'Applied'`,
        [currentJob.title]
      );
    }
    res.json(result[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update job' });
  }
});

router.delete('/jobs/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    await execute('DELETE FROM jobs WHERE id = $1', [req.params.id]);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete job' });
  }
});

// ─────────────────────────────────────────────────────────────
// CANDIDATES
// ─────────────────────────────────────────────────────────────

router.get('/candidates', async (_req: Request, res: Response): Promise<void> => {
  try {
    const candidates = await query(`
      SELECT DISTINCT ON (LOWER(email)) *
      FROM candidates
      ORDER BY LOWER(email), (cv_text IS NOT NULL) DESC, created_at DESC
    `);
    res.json(candidates);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch candidates' });
  }
});

router.get('/candidates/by-email', async (req: Request, res: Response): Promise<void> => {
  try {
    const email = String(req.query.email ?? '').trim();
    if (!email) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }
    const candidates = await query('SELECT * FROM candidates WHERE LOWER(email) = LOWER($1) ORDER BY created_at DESC LIMIT 1', [email]);
    if (candidates.length === 0) {
      res.status(404).json({ error: 'Candidate not found' });
      return;
    }
    res.json(candidates[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch candidate' });
  }
});

router.post('/candidates', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, role, stage, stage_key, source, score, applied, cv_text, cv_url, cv_filename, applied_at, screening_at, interview_at, final_at, offer_at, hired_at, rejected_at } = req.body;
    const result = await query(
      `INSERT INTO candidates (name, email, role, stage, stage_key, source, score, applied, cv_text, cv_url, cv_filename, applied_at, screening_at, interview_at, final_at, offer_at, hired_at, rejected_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18) RETURNING *`,
      [
        name,
        email,
        role,
        stage || 'Applied',
        stage_key || 'Applied',
        source,
        score,
        applied,
        cv_text ?? null,
        cv_url ?? null,
        cv_filename ?? null,
        applied_at ?? null,
        screening_at ?? null,
        interview_at ?? null,
        final_at ?? null,
        offer_at ?? null,
        hired_at ?? null,
        rejected_at ?? null,
      ]
    );
    res.status(201).json(result[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create candidate' });
  }
});

router.get('/candidates/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const candidate = await query('SELECT * FROM candidates WHERE id = $1', [req.params.id]);
    if (candidate.length === 0) {
      res.status(404).json({ error: 'Candidate not found' });
      return;
    }
    res.json(candidate[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch candidate' });
  }
});

router.put('/candidates/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, role, stage, stage_key, source, score, applied, cv_text, cv_url, cv_filename, applied_at, screening_at, interview_at, final_at, offer_at, hired_at, rejected_at } = req.body;
    const result = await query(
      `UPDATE candidates SET name=$1, email=$2, role=$3, stage=$4, stage_key=$5, source=$6, score=$7, applied=$8, cv_text=COALESCE($9, cv_text),
       cv_url=COALESCE($10, cv_url), cv_filename=COALESCE($11, cv_filename),
       applied_at=$12, screening_at=$13, interview_at=$14, final_at=$15, offer_at=$16, hired_at=$17, rejected_at=$18, updated_at=NOW()
       WHERE id=$19 RETURNING *`,
      [
        name,
        email,
        role,
        stage,
        stage_key,
        source,
        score,
        applied,
        cv_text ?? null,
        cv_url ?? null,
        cv_filename ?? null,
        applied_at ?? null,
        screening_at ?? null,
        interview_at ?? null,
        final_at ?? null,
        offer_at ?? null,
        hired_at ?? null,
        rejected_at ?? null,
        req.params.id,
      ]
    );
    if (result.length === 0) {
      res.status(404).json({ error: 'Candidate not found' });
      return;
    }
    res.json(result[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update candidate' });
  }
});

router.delete('/candidates/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    await execute('DELETE FROM candidates WHERE id = $1', [req.params.id]);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete candidate' });
  }
});

// ─────────────────────────────────────────────────────────────
// INTERVIEWS
// ─────────────────────────────────────────────────────────────

router.get('/interviews', async (_req: Request, res: Response): Promise<void> => {
  try {
    const interviews = await query('SELECT * FROM interviews ORDER BY date ASC, time ASC');
    res.json(interviews);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch interviews' });
  }
});

router.post('/interviews', async (req: Request, res: Response): Promise<void> => {
  try {
    const { candidate, role, type, date, time, duration, interviewers, video_link, status } = req.body;
    const result = await query(
      `INSERT INTO interviews (candidate, role, type, date, time, duration, interviewers, video_link, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [candidate, role, type, date, time, duration, interviewers, video_link, status || 'Scheduled']
    );
    res.status(201).json(result[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create interview' });
  }
});

router.put('/interviews/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { candidate, role, type, date, time, duration, interviewers, video_link, notes, status } = req.body;
    const result = await query(
      `UPDATE interviews SET candidate=$1, role=$2, type=$3, date=$4, time=$5, duration=$6, 
       interviewers=$7, video_link=$8, notes=$9, status=$10, updated_at=NOW()
       WHERE id=$11 RETURNING *`,
      [candidate, role, type, date, time, duration, interviewers, video_link, notes, status, req.params.id]
    );
    if (result.length === 0) {
      res.status(404).json({ error: 'Interview not found' });
      return;
    }
    res.json(result[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update interview' });
  }
});

// ─────────────────────────────────────────────────────────────
// EMAILS
// ─────────────────────────────────────────────────────────────

router.get('/emails', async (_req: Request, res: Response): Promise<void> => {
  try {
    const emails = await query('SELECT * FROM emails ORDER BY created_at DESC');
    res.json(emails);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch emails' });
  }
});

router.put('/emails/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { unread } = req.body;
    const result = await query(
      'UPDATE emails SET unread = $1 WHERE id = $2 RETURNING *',
      [unread, req.params.id]
    );
    if (result.length === 0) {
      res.status(404).json({ error: 'Email not found' });
      return;
    }
    res.json(result[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update email' });
  }
});

// ─────────────────────────────────────────────────────────────
// AUDIT LOG
// ─────────────────────────────────────────────────────────────

router.get('/audit', async (_req: Request, res: Response): Promise<void> => {
  try {
    const audit = await query('SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 50');
    res.json(audit);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch audit log' });
  }
});

router.post('/audit', async (req: Request, res: Response): Promise<void> => {
  try {
    const { actor, action, details } = req.body;
    const result = await query(
      'INSERT INTO audit_log (actor, action, details) VALUES ($1, $2, $3) RETURNING *',
      [actor, action, details || null]
    );
    res.status(201).json(result[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create audit entry' });
  }
});

// ─────────────────────────────────────────────────────────────
// ACTIVITY LOG
// ─────────────────────────────────────────────────────────────

router.get('/activity', async (_req: Request, res: Response): Promise<void> => {
  try {
    const activity = await query('SELECT * FROM activity_log ORDER BY created_at DESC LIMIT 20');
    res.json(activity);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch activity' });
  }
});

router.post('/activity', async (req: Request, res: Response): Promise<void> => {
  try {
    const { color, text } = req.body;
    const result = await query(
      'INSERT INTO activity_log (color, text) VALUES ($1, $2) RETURNING *',
      [color, text]
    );
    res.status(201).json(result[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create activity entry' });
  }
});

// ─────────────────────────────────────────────────────────────
// SEARCH (across all entities)
// ─────────────────────────────────────────────────────────────

router.get('/search', async (req: Request, res: Response): Promise<void> => {
  try {
    const q = (req.query.q as string || '').toLowerCase();
    if (q.length < 2) {
      res.json({ candidates: [], jobs: [], emails: [] });
      return;
    }

    const [candidates, jobs, emails] = await Promise.all([
      query(`
        SELECT id, name, email, role, stage, score, initials 
        FROM candidates 
        WHERE LOWER(name) LIKE $1 OR LOWER(email) LIKE $1 OR LOWER(role) LIKE $1
        LIMIT 10
      `, [`%${q}%`]),
      query(`
        SELECT id, title, dept, status, location 
        FROM jobs 
        WHERE LOWER(title) LIKE $1 OR LOWER(dept) LIKE $1 OR LOWER(skills) LIKE $1
        LIMIT 10
      `, [`%${q}%`]),
      query(`
        SELECT id, from_name as "from", subject, preview, time, unread
        FROM emails 
        WHERE LOWER(from_name) LIKE $1 OR LOWER(subject) LIKE $1 OR LOWER(preview) LIKE $1
        LIMIT 10
      `, [`%${q}%`])
    ]);

    res.json({ candidates, jobs, emails });
  } catch (err) {
    res.status(500).json({ error: 'Search failed' });
  }
});

export default router;
