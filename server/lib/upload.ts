/**
 * File Upload Handler
 * ──────────────────
 * Multer configuration for CV file uploads
 */

import multer from 'multer';
import type { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads/cvs';

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  console.log(`[Upload] Created directory: ${UPLOAD_DIR}`);
}

const storage = multer.diskStorage({
  destination: (_req: Request, _file: any, cb: any) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req: Request, file: any, cb: any) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${unique}${ext}`);
  },
});

const fileFilter = (_req: Request, file: any, cb: any) => {
  const allowed = ['.pdf', '.doc', '.docx'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF, DOC, DOCX files are allowed'), false);
  }
};

// Configure multer for CV uploads (max 5MB)
export const uploadCV = multer({
  storage,
  fileFilter,
  limits: { 
    fileSize: 5 * 1024 * 1024, // 5MB max
    files: 1
  },
}).single('cv');

// Error handler middleware for multer
export function handleUploadError(
  err: Error | null,
  _req: Request,
  res: Response,
  next: NextFunction
) {
  if (err) {
    console.error('[Upload Error]', err.message);
    return res.status(400).json({ error: err.message });
  }
  next();
}
