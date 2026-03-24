/**
 * Applications Routes
 * ──────────────────
 * API endpoints for job applications
 */

import { Router, type Request, type Response } from 'express';
import { query, queryOne } from '../lib/db.js';
import { uploadCV, handleUploadError } from '../lib/upload.js';

interface Application {
  id: string;
  job_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  linkedin_url: string | null;
  cover_letter: string | null;
  cv_url: string | null;
  cv_filename: string | null;
  status: string;
  notes: string | null;
  applied_at: Date;
  updated_at: Date;
}

const applicationsRouter = Router();

// ── POST /api/applications ── Submit an application (public, no auth)
applicationsRouter.post('/', (req: Request, res: Response) => {
  uploadCV(req, res, async (uploadErr) => {
    if (uploadErr) {
      return res.status(400).json({ error: uploadErr.message });
    }

    const { job_id, full_name, email, phone, linkedin_url, cover_letter } = req.body;

    if (!job_id || !full_name || !email) {
      return res.status(400).json({ error: 'job_id, full_name and email are required' });
    }

    // Verify job exists and is active
    const jobCheck = await queryOne<{ id: string }>(
      'SELECT id FROM jobs WHERE id = $1 AND (is_active = TRUE OR is_active IS NULL)',
      [job_id]
    );
    if (!jobCheck) {
      return res.status(404).json({ error: 'Job not found or applications are closed' });
    }

    try {
      const cv_url = req.file ? `/uploads/cvs/${req.file.filename}` : null;
      const cv_filename = req.file ? req.file.originalname : null;

      const result = await query<Application>(
        `INSERT INTO applications
           (job_id, full_name, email, phone, linkedin_url, cover_letter, cv_url, cv_filename)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         ON CONFLICT (job_id, email)
         DO UPDATE SET
           full_name    = EXCLUDED.full_name,
           phone        = EXCLUDED.phone,
           cover_letter = EXCLUDED.cover_letter,
           cv_url       = COALESCE(EXCLUDED.cv_url, applications.cv_url),
           cv_filename  = COALESCE(EXCLUDED.cv_filename, applications.cv_filename),
           updated_at   = NOW()
         RETURNING id, full_name, email, applied_at`,
        [job_id, full_name, email, phone, linkedin_url, cover_letter, cv_url, cv_filename]
      );

      const application = result[0];
      if (!application) {
        return res.status(500).json({ error: 'Failed to submit application' });
      }

      return res.status(201).json({
        success: true,
        message: 'Application submitted successfully!',
        applicationId: application.id,
      });
    } catch (err: any) {
      console.error('[Submit Application]', err);
      return res.status(500).json({ error: 'Failed to submit application' });
    }
  });
});

// ── GET /api/applications?job_id=xxx ── List applicants for a job (employer)
applicationsRouter.get('/', async (req: Request, res: Response) => {
  const { job_id, status } = req.query;

  if (!job_id) {
    return res.status(400).json({ error: 'job_id is required' });
  }

  try {
    const filters: unknown[] = [job_id];
    let statusClause = '';
    if (status) {
      filters.push(status);
      statusClause = `AND status = $${filters.length}`;
    }

    const result = await query<Application>(
      `SELECT
         id, full_name, email, phone, linkedin_url,
         cover_letter, cv_url, cv_filename,
         status, notes, applied_at, updated_at
       FROM applications
       WHERE job_id = $1 ${statusClause}
       ORDER BY applied_at DESC`,
      filters
    );

    // Count by status
    const countResult = await query<{ status: string; count: number }>(
      `SELECT status, COUNT(*)::int AS count
       FROM applications
       WHERE job_id = $1
       GROUP BY status`,
      [job_id]
    );

    const counts = {
      new: 0,
      shortlisted: 0,
      rejected: 0,
      hired: 0
    };

    countResult.forEach((r: { status: string; count: number }) => {
      if (r.status in counts) {
        counts[r.status as keyof typeof counts] = r.count;
      }
    });

    return res.json({
      applications: result,
      total: result.length,
      counts,
    });
  } catch (err) {
    console.error('[List Applications]', err);
    return res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// ── PATCH /api/applications/:id ── Update status or notes
applicationsRouter.patch('/:id', async (req: Request, res: Response) => {
  const { status, notes } = req.body;
  const validStatuses = ['new', 'shortlisted', 'rejected', 'hired'];

  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${validStatuses.join(', ')}` });
  }

  try {
    const result = await query(
      `UPDATE applications
       SET status     = COALESCE($1, status),
           notes      = COALESCE($2, notes),
           updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [status, notes, req.params.id]
    );

    if (result.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }

    return res.json({ application: result[0] });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update application' });
  }
});

export default applicationsRouter;
