/**
 * Zod Schemas — Runtime Input Validation
 * ────────────────────────────────────────
 * All form data is validated at the boundary (before API calls).
 * Schemas are the single source of truth for shape + constraints.
 */

import { z } from 'zod';

// ── Primitives ────────────────────────────────────────────────────────────────

const email  = z.string().email('Invalid email address').max(254);
const name   = z.string().min(1, 'Required').max(100).trim();
const nonEmpty = z.string().min(1, 'Required').trim();

// ── Auth ──────────────────────────────────────────────────────────────────────

export const LoginSchema = z.object({
  email:    email,
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
});
export type LoginInput = z.infer<typeof LoginSchema>;

// ── Jobs ──────────────────────────────────────────────────────────────────────

export const NewJobSchema = z.object({
  title:    nonEmpty.max(200, 'Title too long'),
  dept:     nonEmpty,
  type:     z.enum(['Full-time', 'Part-time', 'Contract']),
  location: nonEmpty,
  desc:     z.string().max(5000).trim().optional(),
  skills:   z.string().max(500).trim().optional(),
});
export type NewJobInput = z.infer<typeof NewJobSchema>;

// ── Candidates ────────────────────────────────────────────────────────────────

export const NewCandidateSchema = z.object({
  fname:  name,
  lname:  name,
  email:  email,
  source: z.enum(['LinkedIn', 'Referral', 'Job Board', 'Direct']),
});
export type NewCandidateInput = z.infer<typeof NewCandidateSchema>;

// ── Interview ─────────────────────────────────────────────────────────────────

export const ScheduleInterviewSchema = z.object({
  candidate:    nonEmpty,
  type:         z.enum(['Screening', 'Technical', 'Final', 'Culture']),
  date:         z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date'),
  time:         z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time'),
  duration:     z.coerce.number().int().min(15).max(480),
  interviewers: nonEmpty.max(300),
  notes:        z.string().max(1000).trim().optional(),
});
export type ScheduleInterviewInput = z.infer<typeof ScheduleInterviewSchema>;

// ── Portal application ────────────────────────────────────────────────────────

export const PortalApplicationSchema = z.object({
  fname:     name,
  lname:     name,
  email:     email,
  phone:     z.string().max(30).optional(),
  location:  z.string().max(100).optional(),
  linkedin:  z.string().url('Invalid URL').max(200).optional().or(z.literal('')),
  portfolio: z.string().url('Invalid URL').max(200).optional().or(z.literal('')),
  cover:     z.string().max(3000).optional(),
  source:    z.string().max(50).optional(),
});
export type PortalApplicationInput = z.infer<typeof PortalApplicationSchema>;

// ── Utility: safe parse with typed errors ─────────────────────────────────────

export function parseOrThrow<T>(schema: z.ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const msg = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
    throw new Error(`Validation failed: ${msg}`);
  }
  return result.data;
}

export function fieldErrors<T>(schema: z.ZodType<T>, data: unknown): Partial<Record<string, string>> {
  const result = schema.safeParse(data);
  if (result.success) return {};
  return Object.fromEntries(
    result.error.errors.map(e => [e.path.join('.'), e.message]),
  );
}
