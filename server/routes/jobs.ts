/**
 * Jobs Routes
 * ──────────────────
 * API endpoints for job postings
 */

import { Router, type Request, type Response } from 'express';
import { query, queryOne } from '../lib/db.js';
import { generateSlug } from '../lib/slugGenerator.js';

interface Job {
  id: string;
  slug: string;
  title: string;
  company: string;
  location: string | null;
  type: string;
  description: string;
  requirements: string | null;
  salary_range: string | null;
  deadline: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: Date;
  updated_at: Date;
}

const jobsRouter = Router();

// ── POST /api/jobs ── Create a job, returns shareable link
jobsRouter.post('/', async (req: Request, res: Response) => {
  const {
    title, company, location, type,
    description, requirements, salary_range,
    deadline, created_by,
  } = req.body;

  if (!title || !company || !description) {
    return res.status(400).json({ error: 'title, company, and description are required' });
  }

  try {
    // Generate a unique slug — retry on collision (extremely rare)
    let slug = generateSlug();
    let attempts = 0;
    while (attempts < 5) {
      const existing = await queryOne<{ id: string }>('SELECT id FROM jobs WHERE slug = $1', [slug]);
      if (!existing) break;
      slug = generateSlug();
      attempts++;
    }

    const result = await query<Job>(
      `INSERT INTO jobs
         (slug, title, company, location, type, description,
          requirements, salary_range, deadline, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [slug, title, company, location, type || 'Full-time', description,
       requirements, salary_range, deadline, created_by]
    );

    const job = result[0];
    if (!job) {
      return res.status(500).json({ error: 'Failed to create job' });
    }

    // Build the public application URL
    const applyUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/apply/${job.slug}`;

    return res.status(201).json({ job, applyUrl });
  } catch (err: any) {
    console.error('[Create Job]', err);
    return res.status(500).json({ error: 'Failed to create job' });
  }
});

// ── GET /api/jobs ── List all jobs for an employer
jobsRouter.get('/', async (req: Request, res: Response) => {
  const { created_by } = req.query;

  try {
    const result = await query<any>(
      `SELECT
         j.*,
         COUNT(a.id)::int AS applicant_count,
         COUNT(a.id) FILTER (WHERE a.status = 'new')::int         AS new_count,
         COUNT(a.id) FILTER (WHERE a.status = 'shortlisted')::int AS shortlisted_count
       FROM jobs j
       LEFT JOIN applications a ON a.job_id = j.id
       WHERE ($1::uuid IS NULL OR j.created_by = $1)
       GROUP BY j.id
       ORDER BY j.created_at DESC`,
      [created_by || null]
    );

    const jobs = result.map((job: any) => ({
      ...job,
      applyUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/apply/${job.slug}`,
    }));

    return res.json({ jobs });
  } catch (err) {
    console.error('[List Jobs]', err);
    return res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

// ── GET /api/jobs/public/:slug ── Public job detail (no auth required)
jobsRouter.get('/public/:slug', async (req: Request, res: Response) => {
  try {
    const result = await queryOne<any>(
      `SELECT id, slug, title, company, location, type,
              description, requirements, salary_range,
              deadline, is_active, created_at
       FROM jobs
       WHERE slug = $1 AND (is_active = TRUE OR is_active IS NULL)`,
      [req.params.slug]
    );

    if (!result) {
      return res.status(404).json({ error: 'Job not found or no longer active' });
    }

    return res.json({ job: result });
  } catch (err) {
    console.error('[Public Job]', err);
    return res.status(500).json({ error: 'Failed to fetch job' });
  }
});

// ── GET /api/jobs/:id ── Single job detail (employer)
jobsRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const result = await queryOne<any>(
      'SELECT * FROM jobs WHERE id = $1',
      [req.params.id]
    );
    if (!result) {
      return res.status(404).json({ error: 'Job not found' });
    }
    const job = {
      ...result,
      applyUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/apply/${result.slug}`,
    };
    return res.json({ job });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch job' });
  }
});

// ── PATCH /api/jobs/:id ── Toggle active / update
jobsRouter.patch('/:id', async (req: Request, res: Response) => {
  const { is_active } = req.body;
  try {
    const result = await query(
      `UPDATE jobs SET is_active = COALESCE($1, is_active),
                       updated_at = NOW()
       WHERE id = $2 RETURNING *`,
      [is_active, req.params.id]
    );
    if (result.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }
    return res.json({ job: result[0] });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update job' });
  }
});

// ── DELETE /api/jobs/:id
jobsRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    await query('DELETE FROM jobs WHERE id = $1', [req.params.id]);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete job' });
  }
});

export default jobsRouter;
