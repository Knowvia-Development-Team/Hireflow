/**
 * Applications Routes
 * ──────────────────
 * API endpoints for job applications
 */

import { Router, type Request, type Response } from 'express';
import { query, queryOne } from '../lib/db.js';
import { uploadCV } from '../lib/upload.js';
import { extractCvText } from '../lib/cv-text.js';
import { analyseSkillGap } from '../services/skill-gap.js';

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

// ── POST /api/applications/cv-text ── Extract text from uploaded CV (public)
applicationsRouter.post('/cv-text', (req: Request, res: Response) => {
  uploadCV(req, res, async (uploadErr) => {
    if (uploadErr) {
      return res.status(400).json({ error: uploadErr.message });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'CV file is required' });
    }
    const { text, warnings } = await extractCvText(req.file.path, req.file.originalname);
    const cv_url = `/uploads/cvs/${req.file.filename}`;
    const cv_filename = req.file.originalname;
    return res.json({ text, warnings, cv_url, cv_filename });
  });
});

// ── POST /api/applications ── Submit an application (public, no auth)
applicationsRouter.post('/', (req: Request, res: Response) => {
  uploadCV(req, res, async (uploadErr) => {
    if (uploadErr) {
      return res.status(400).json({ error: uploadErr.message });
    }

    const { job_id, full_name, email, phone, linkedin_url, cover_letter, cv_text, cv_url: body_cv_url, cv_filename: body_cv_filename, source } = req.body;

    if (!job_id || !full_name || !email) {
      return res.status(400).json({ error: 'job_id, full_name and email are required' });
    }

    // Verify job exists and is active
    const jobCheck = await queryOne<any>(
      'SELECT * FROM jobs WHERE id = $1',
      [job_id]
    );
    if (!jobCheck || jobCheck?.is_active === false) {
      return res.status(404).json({ error: 'Job not found or applications are closed' });
    }

    try {
      const cv_url = req.file ? `/uploads/cvs/${req.file.filename}` : (body_cv_url ? String(body_cv_url) : null);
      const cv_filename = req.file ? req.file.originalname : (body_cv_filename ? String(body_cv_filename) : null);
      const cvTextResult = req.file ? await extractCvText(req.file.path, req.file.originalname) : { text: '', warnings: [] };
      const fallbackText = typeof cv_text === 'string' ? cv_text : '';
      const cvText = cvTextResult.text || fallbackText;
      const analysisText = cvText.trim() ? cvText : (cover_letter ?? '');

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

      let analysis: { fitScore: number; strengths: unknown[]; missing: unknown[]; summary: string[] } | null = null;
      if (analysisText.trim()) {
        try {
          const jobText = [
            jobCheck.title ? `Title: ${jobCheck.title}` : '',
            jobCheck.company ? `Company: ${jobCheck.company}` : '',
            jobCheck.description ? `Description: ${jobCheck.description}` : '',
            jobCheck.requirements ? `Requirements: ${jobCheck.requirements}` : '',
            jobCheck.skills ? `Skills: ${jobCheck.skills}` : '',
            jobCheck.dept ? `Department: ${jobCheck.dept}` : '',
          ].filter(Boolean).join('\n');
          analysis = await analyseSkillGap(jobText, analysisText, {});
          await query(
            `UPDATE applications
             SET match_score = $1,
                 match_result = $2,
                 ai_analyzed_at = NOW()
             WHERE id = $3`,
            [analysis.fitScore, analysis, application.id]
          );
        } catch (err) {
          console.warn('[Applications] Analysis failed:', err instanceof Error ? err.message : String(err));
        }
      }

      // Sync into main candidates list for admin UI
      try {
        const existingCandidate = await queryOne<{ id: string }>(
          'SELECT id FROM candidates WHERE LOWER(email) = LOWER($1) AND role = $2 ORDER BY created_at DESC LIMIT 1',
          [email, jobCheck.title]
        );
        const appliedLabel = 'Today';
        const sourceLabel = source ? String(source) : (cv_url ? 'CV Upload' : 'Direct');
        const scoreValue = analysis?.fitScore ?? null;

        if (existingCandidate) {
          await query(
            `UPDATE candidates
             SET name=$1,
                 email=$2,
                 role=$3,
                 stage='Applied',
                 stage_key='Applied',
                 source=$4,
                 score=COALESCE($5, score),
                 applied=$6,
                 cv_text=COALESCE($7, cv_text),
                 cv_url=COALESCE($8, cv_url),
                 cv_filename=COALESCE($9, cv_filename),
                 applied_at=COALESCE($10, applied_at),
                 updated_at=NOW()
             WHERE id=$11`,
            [
              full_name,
              email,
              jobCheck.title,
              sourceLabel,
              scoreValue,
              appliedLabel,
              cvText || null,
              cv_url,
              cv_filename,
              new Date().toISOString(),
              existingCandidate.id,
            ]
          );
        } else {
          await query(
            `INSERT INTO candidates
               (name, email, role, stage, stage_key, source, score, applied, cv_text, cv_url, cv_filename, applied_at)
             VALUES ($1,$2,$3,'Applied','Applied',$4,$5,$6,$7,$8,$9,$10)`,
            [
              full_name,
              email,
              jobCheck.title,
              sourceLabel,
              scoreValue,
              appliedLabel,
              cvText || null,
              cv_url,
              cv_filename,
              new Date().toISOString(),
            ]
          );
        }
      } catch (err) {
        console.warn('[Applications] Candidate sync failed:', err instanceof Error ? err.message : String(err));
      }

      return res.status(201).json({
        success: true,
        message: 'Application submitted successfully!',
        applicationId: application.id,
        analysis,
        warnings: cvTextResult.warnings,
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
         match_score, match_result,
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
