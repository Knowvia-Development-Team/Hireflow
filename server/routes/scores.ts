import { Router, type Request, type Response } from 'express';
import { query, execute } from '../lib/db.js';

interface InterviewScore {
  id: string;
  candidate_id: string;
  job_id: string;
  score: number;
  interviewer: string;
  comments: string | null;
  interview_date: Date;
  created_at: Date;
}

interface ScoreWithCandidate extends InterviewScore {
  candidate_name: string;
  candidate_email: string;
  job_title: string;
}

interface ApplicationOption {
  id: string;
  full_name: string;
  email: string;
  job_title: string;
}

const router = Router();

// GET /api/scores - Fetch all interview scores with candidate info
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const { job_id } = _req.query;
    
    let queryText = `
      SELECT 
        s.id,
        s.candidate_id,
        s.job_id,
        s.score,
        s.interviewer,
        s.comments,
        s.interview_date,
        s.created_at,
        a.full_name as candidate_name,
        a.email as candidate_email,
        j.title as job_title
      FROM interview_scores s
      LEFT JOIN applications a ON s.candidate_id = a.id
      LEFT JOIN jobs j ON s.job_id = j.id
    `;
    
    const params: unknown[] = [];
    
    if (job_id) {
      queryText += ` WHERE s.job_id = $1`;
      params.push(job_id);
    }
    
    queryText += ` ORDER BY s.score DESC, s.interview_date DESC`;
    
    const result = await query<ScoreWithCandidate>(queryText, params);
    
    res.json({
      success: true,
      data: result.map(row => ({
        id: row.id,
        candidateId: row.candidate_id,
        candidateName: row.candidate_name,
        candidateEmail: row.candidate_email,
        jobId: row.job_id,
        jobTitle: row.job_title,
        score: row.score,
        interviewer: row.interviewer,
        comments: row.comments,
        interviewDate: row.interview_date,
        createdAt: row.created_at,
      })),
    });
  } catch (error) {
    console.error('[scores] Error fetching scores:', error);
    res.status(500).json({ error: 'Failed to fetch scores' });
  }
});

// GET /api/scores/leaderboard - Get top scores sorted
router.get('/leaderboard', async (_req: Request, res: Response): Promise<void> => {
  try {
    const { limit } = _req.query;
    const limitNum = limit ? Number(limit) : 50;
    
    const result = await query<ScoreWithCandidate>(`
      SELECT 
        s.id,
        s.candidate_id,
        s.job_id,
        s.score,
        s.interviewer,
        s.interview_date,
        a.full_name as candidate_name,
        a.email as candidate_email,
        j.title as job_title
      FROM interview_scores s
      LEFT JOIN applications a ON s.candidate_id = a.id
      LEFT JOIN jobs j ON s.job_id = j.id
      ORDER BY s.score DESC, s.interview_date DESC
      LIMIT $1
    `, [limitNum]);
    
    res.json({
      success: true,
      data: result.map((row, index) => ({
        rank: index + 1,
        id: row.id,
        candidateId: row.candidate_id,
        candidateName: row.candidate_name,
        candidateEmail: row.candidate_email,
        jobId: row.job_id,
        jobTitle: row.job_title,
        score: row.score,
        interviewer: row.interviewer,
        interviewDate: row.interview_date,
      })),
    });
  } catch (error) {
    console.error('[scores] Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// GET /api/scores/candidates - Get list of candidates for dropdown
router.get('/candidates', async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await query<ApplicationOption>(`
      SELECT 
        a.id,
        a.full_name,
        a.email,
        j.title as job_title
      FROM applications a
      LEFT JOIN jobs j ON a.job_id = j.id
      WHERE a.status NOT IN ('rejected', 'hired')
      ORDER BY a.full_name ASC
    `);
    
    res.json({
      success: true,
      data: result.map(row => ({
        id: row.id,
        fullName: row.full_name,
        email: row.email,
        jobTitle: row.job_title,
      })),
    });
  } catch (error) {
    console.error('[scores] Error fetching candidates:', error);
    res.status(500).json({ error: 'Failed to fetch candidates' });
  }
});

// POST /api/scores - Create new interview score
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { candidate_id, job_id, score, interviewer, comments, interview_date } = req.body;
    
    // Validation
    if (!candidate_id || !job_id || score === undefined || !interviewer || !interview_date) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }
    
    if (score < 0 || score > 100) {
      res.status(400).json({ error: 'Score must be between 0 and 100' });
      return;
    }
    
    const result = await execute(`
      INSERT INTO interview_scores (candidate_id, job_id, score, interviewer, comments, interview_date)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `, [candidate_id, job_id, score, interviewer, comments || null, interview_date]);
    
    if (result === 0) {
      res.status(500).json({ error: 'Failed to create score' });
      return;
    }
    
    res.json({ success: true, message: 'Score saved successfully' });
  } catch (error) {
    console.error('[scores] Error creating score:', error);
    res.status(500).json({ error: 'Failed to create score' });
  }
});

// GET /api/scores/jobs - Get list of jobs for dropdown
router.get('/jobs', async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await query<{ id: string; title: string }>(`
      SELECT id, title FROM jobs WHERE is_active = true ORDER BY title ASC
    `);
    
    res.json({
      success: true,
      data: result.map(row => ({
        id: row.id,
        title: row.title,
      })),
    });
  } catch (error) {
    console.error('[scores] Error fetching jobs:', error);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

export default router;