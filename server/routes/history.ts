import { Router, type Request, type Response } from 'express';
import { query } from '../lib/db.js';

interface HistoryRecord {
  id: string;
  name: string;
  email: string;
  status: string;
  job_title: string | null;
  job_id: string | null;
  applied_at: Date | null;
  rejected_at: Date | null;
  hired_at: Date | null;
}

interface HistoryStats {
  status: string;
  count: string;
}

const router = Router();

// GET /api/history - Fetch rejected and hired candidates
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const { status } = _req.query;

    let queryText = `
      SELECT 
        c.id,
        c.name,
        c.email,
        LOWER(c.stage_key) as status,
        c.applied as applied_at,
        CASE WHEN LOWER(c.stage_key) = 'rejected' THEN NOW() ELSE NULL END as rejected_at,
        CASE WHEN LOWER(c.stage_key) = 'hired' THEN NOW() ELSE NULL END as hired_at,
        c.role as job_title,
        NULL as job_id
      FROM candidates c
      WHERE LOWER(c.stage_key) IN ('rejected', 'hired')
    `;

    const params: unknown[] = [];

    if (status && (status === 'rejected' || status === 'hired')) {
      queryText += ` AND LOWER(c.stage_key) = $1`;
      params.push(status);
    }

    queryText += ` ORDER BY 
      CASE LOWER(c.stage_key) 
        WHEN 'hired' THEN 1 
        WHEN 'rejected' THEN 2 
      END`;

    const result = await query<HistoryRecord>(queryText, params);

    res.json({
      success: true,
      data: result.map(row => ({
        id: row.id,
        name: row.name,
        email: row.email,
        status: row.status,
        jobTitle: row.job_title,
        jobId: row.job_id,
        appliedAt: row.applied_at,
        decidedAt: row.hired_at || row.rejected_at,
      })),
    });
  } catch (error) {
    console.error('[history] Error fetching history:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// GET /api/history/stats - Get summary statistics
router.get('/stats', async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await query<HistoryStats>(`
      SELECT 
        LOWER(stage_key) as status,
        COUNT(*) as count
      FROM candidates
      WHERE LOWER(stage_key) IN ('rejected', 'hired')
      GROUP BY LOWER(stage_key)
    `);
    
    const stats = {
      rejected: 0,
      hired: 0,
    };
    
    result.forEach(row => {
      if (row.status === 'rejected') stats.rejected = Number(row.count);
      if (row.status === 'hired') stats.hired = Number(row.count);
    });
    
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('[history] Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export default router;
