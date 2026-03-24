import { describe, it, expect } from 'vitest';
import {
  LoginSchema, NewJobSchema, NewCandidateSchema,
  ScheduleInterviewSchema,
  parseOrThrow, fieldErrors,
} from '../validators';

describe('LoginSchema', () => {
  it('accepts valid credentials', () => {
    const result = LoginSchema.safeParse({ email: 'user@test.com', password: 'password123' });
    expect(result.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const result = LoginSchema.safeParse({ email: 'not-an-email', password: 'password123' });
    expect(result.success).toBe(false);
  });

  it('rejects password shorter than 8 chars', () => {
    const result = LoginSchema.safeParse({ email: 'user@test.com', password: 'short' });
    expect(result.success).toBe(false);
  });
});

describe('NewJobSchema', () => {
  it('accepts a minimal valid job', () => {
    const result = NewJobSchema.safeParse({ title: 'Engineer', dept: 'Engineering', type: 'Full-time', location: 'Remote' });
    expect(result.success).toBe(true);
  });

  it('rejects empty title', () => {
    const result = NewJobSchema.safeParse({ title: '', dept: 'Engineering', type: 'Full-time', location: 'Remote' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid employment type', () => {
    const result = NewJobSchema.safeParse({ title: 'Dev', dept: 'Eng', type: 'Freelance', location: 'Remote' });
    expect(result.success).toBe(false);
  });
});

describe('NewCandidateSchema', () => {
  it('accepts valid candidate data', () => {
    const result = NewCandidateSchema.safeParse({ fname: 'John', lname: 'Doe', email: 'john@test.com', source: 'LinkedIn' });
    expect(result.success).toBe(true);
  });

  it('rejects empty first name', () => {
    const result = NewCandidateSchema.safeParse({ fname: '', lname: 'Doe', email: 'john@test.com', source: 'LinkedIn' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid source', () => {
    const result = NewCandidateSchema.safeParse({ fname: 'J', lname: 'D', email: 'j@t.com', source: 'Twitter' });
    expect(result.success).toBe(false);
  });
});

describe('ScheduleInterviewSchema', () => {
  const valid = { candidate: 'Lena Müller', type: 'Final', date: '2026-03-18', time: '10:00', duration: 60, interviewers: 'Tino' };

  it('accepts valid interview', () => {
    expect(ScheduleInterviewSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects badly formatted date', () => {
    const result = ScheduleInterviewSchema.safeParse({ ...valid, date: '18/03/2026' });
    expect(result.success).toBe(false);
  });

  it('rejects duration below minimum', () => {
    const result = ScheduleInterviewSchema.safeParse({ ...valid, duration: 5 });
    expect(result.success).toBe(false);
  });
});

describe('parseOrThrow()', () => {
  it('returns parsed data on success', () => {
    const result = parseOrThrow(LoginSchema, { email: 'a@b.com', password: 'password123' });
    expect(result.email).toBe('a@b.com');
  });

  it('throws a descriptive error on failure', () => {
    expect(() => parseOrThrow(LoginSchema, { email: 'bad', password: '123' }))
      .toThrow('Validation failed');
  });
});

describe('fieldErrors()', () => {
  it('returns empty object for valid data', () => {
    const errors = fieldErrors(LoginSchema, { email: 'a@b.com', password: 'password123' });
    expect(errors).toEqual({});
  });

  it('returns field-keyed errors for invalid data', () => {
    const errors = fieldErrors(LoginSchema, { email: 'bad', password: '123' });
    expect(typeof errors['email']).toBe('string');
    expect(typeof errors['password']).toBe('string');
  });
});
