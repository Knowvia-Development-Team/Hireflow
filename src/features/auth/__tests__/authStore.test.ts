import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore }   from '../store/authStore';
import { getAccessToken } from '@/shared/lib/api/client';

const MOCK_USER = {
  id:       'usr-001',
  name:     'Tino Dube',
  email:    'tino@hireflow.io',
  role:     'Admin' as const,
  initials: 'TD',
};

describe('authStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useAuthStore.setState({ user: null, isAuthed: false });
  });

  it('starts unauthenticated', () => {
    const { isAuthed, user } = useAuthStore.getState();
    expect(isAuthed).toBe(false);
    expect(user).toBeNull();
  });

  it('login sets user and access token', () => {
    useAuthStore.getState().login(MOCK_USER, 'test-token-abc');
    const { isAuthed, user } = useAuthStore.getState();
    expect(isAuthed).toBe(true);
    expect(user?.name).toBe('Tino Dube');
    expect(getAccessToken()).toBe('test-token-abc');
  });

  it('logout clears user and token', () => {
    useAuthStore.getState().login(MOCK_USER, 'token');
    useAuthStore.getState().logout();
    const { isAuthed, user } = useAuthStore.getState();
    expect(isAuthed).toBe(false);
    expect(user).toBeNull();
    expect(getAccessToken()).toBeNull();
  });

  it('hasRole returns true for matching role', () => {
    useAuthStore.getState().login(MOCK_USER, 'token');
    expect(useAuthStore.getState().hasRole(['Admin'])).toBe(true);
    expect(useAuthStore.getState().hasRole(['Admin', 'Recruiter'])).toBe(true);
  });

  it('hasRole returns false for non-matching role', () => {
    useAuthStore.getState().login(MOCK_USER, 'token');
    expect(useAuthStore.getState().hasRole(['Recruiter'])).toBe(false);
    expect(useAuthStore.getState().hasRole(['Interviewer', 'Read-only'])).toBe(false);
  });

  it('hasRole returns false when not authenticated', () => {
    expect(useAuthStore.getState().hasRole(['Admin'])).toBe(false);
  });

  it('canWrite returns true for Admin', () => {
    useAuthStore.getState().login(MOCK_USER, 'token');
    expect(useAuthStore.getState().canWrite()).toBe(true);
  });

  it('canWrite returns true for Recruiter', () => {
    useAuthStore.getState().login({ ...MOCK_USER, role: 'Recruiter' }, 'token');
    expect(useAuthStore.getState().canWrite()).toBe(true);
  });

  it('canWrite returns false for Interviewer', () => {
    useAuthStore.getState().login({ ...MOCK_USER, role: 'Interviewer' }, 'token');
    expect(useAuthStore.getState().canWrite()).toBe(false);
  });

  it('canWrite returns false for Read-only', () => {
    useAuthStore.getState().login({ ...MOCK_USER, role: 'Read-only' }, 'token');
    expect(useAuthStore.getState().canWrite()).toBe(false);
  });

  it('stores the correct user role', () => {
    useAuthStore.getState().login({ ...MOCK_USER, role: 'Recruiter' }, 'token');
    expect(useAuthStore.getState().user?.role).toBe('Recruiter');
  });
});
