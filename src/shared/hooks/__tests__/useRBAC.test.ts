import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useRBAC }    from '../useRBAC';
import { useAuthStore } from '@/features/auth/store/authStore';

const mkUser = (role: 'Admin' | 'Recruiter' | 'Interviewer' | 'Read-only') => ({
  id: 'u1', name: 'Test', email: 't@t.com', role, initials: 'TT',
});

describe('useRBAC', () => {
  beforeEach(() => { useAuthStore.setState({ user: null, isAuthed: false }); });

  it('returns null role when unauthenticated', () => {
    const { result } = renderHook(() => useRBAC());
    expect(result.current.role).toBeNull();
  });

  it('returns canWrite=false when unauthenticated', () => {
    const { result } = renderHook(() => useRBAC());
    expect(result.current.canWrite).toBe(false);
  });

  it('returns canAdmin=false when unauthenticated', () => {
    const { result } = renderHook(() => useRBAC());
    expect(result.current.canAdmin).toBe(false);
  });

  it('Admin role: canWrite=true, canAdmin=true', () => {
    useAuthStore.getState().login(mkUser('Admin'), 't');
    const { result } = renderHook(() => useRBAC());
    expect(result.current.role).toBe('Admin');
    expect(result.current.canWrite).toBe(true);
    expect(result.current.canAdmin).toBe(true);
  });

  it('Recruiter role: canWrite=true, canAdmin=false', () => {
    useAuthStore.getState().login(mkUser('Recruiter'), 't');
    const { result } = renderHook(() => useRBAC());
    expect(result.current.canWrite).toBe(true);
    expect(result.current.canAdmin).toBe(false);
  });

  it('Interviewer role: canWrite=false, canAdmin=false', () => {
    useAuthStore.getState().login(mkUser('Interviewer'), 't');
    const { result } = renderHook(() => useRBAC());
    expect(result.current.canWrite).toBe(false);
    expect(result.current.canAdmin).toBe(false);
  });

  it('Read-only role: canWrite=false, canAdmin=false', () => {
    useAuthStore.getState().login(mkUser('Read-only'), 't');
    const { result } = renderHook(() => useRBAC());
    expect(result.current.canWrite).toBe(false);
    expect(result.current.canAdmin).toBe(false);
  });

  it('hasRole helper works for combined role arrays', () => {
    useAuthStore.getState().login(mkUser('Recruiter'), 't');
    const { result } = renderHook(() => useRBAC());
    expect(result.current.hasRole(['Admin', 'Recruiter'])).toBe(true);
    expect(result.current.hasRole(['Admin'])).toBe(false);
  });
});
