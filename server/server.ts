import 'dotenv/config';
import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import path from 'path';

import extractRoute   from './routes/extract.js';
import matchRoute     from './routes/match.js';
import sentimentRoute from './routes/sentiment.js';
import dataRoute      from './routes/data.js';
import jobsRouter     from './routes/jobs.js';
import applicationsRouter from './routes/applications.js';

const app  = express();
const PORT = Number(process.env['PORT'] ?? 3001);

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:4173'] }));
app.use(express.json({ limit: '1mb' }));

app.use((req: Request, _res: Response, next: NextFunction): void => {
  console.warn(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/analyse/extract',   extractRoute);
app.use('/api/analyse/match',     matchRoute);
app.use('/api/analyse/sentiment', sentimentRoute);
app.use('/api/data',             dataRoute);

// Job application system routes
app.use('/api/jobs',             jobsRouter);
app.use('/api/applications',     applicationsRouter);

// Serve uploaded CVs as static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (_req: Request, res: Response): void => {
  res.json({
    status: 'ok',
    token:  process.env['HF_TOKEN'] ? '✓ HF_TOKEN set' : '✗ HF_TOKEN missing',
    models: {
      text_gen:   'mistralai/Mistral-7B-Instruct-v0.3',
      embeddings: 'sentence-transformers/all-MiniLM-L6-v2',
      sentiment:  'cardiffnlp/twitter-roberta-base-sentiment-latest',
      zero_shot:  'facebook/bart-large-mnli',
    },
  });
});

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((_req: Request, res: Response): void => {
  res.status(404).json({ error: 'Route not found' });
});

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction): void => {
  const msg = err instanceof Error ? err.message : 'Internal server error';
  console.error('[server error]', msg);
  res.status(500).json({ error: msg });
});

app.listen(PORT, () => {
  console.warn(`\n🚀  HireFlow API running on http://localhost:${PORT}`);
  console.warn(`   Health: http://localhost:${PORT}/api/health\n`);
  if (!process.env['HF_TOKEN']) {
    console.warn('⚠  HF_TOKEN not set — copy server/.env.example → server/.env\n');
  }
});
