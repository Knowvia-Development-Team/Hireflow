/**
 * Auth Store — Zustand
 * ─────────────────────
 * Handles authentication state.
 * Access token is NEVER persisted to disk — stored in memory only.
 * Refresh token is an httpOnly cookie (set by the server).
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { setAccessToken } from '@/shared/lib/api/client';
import type { UserRole } from '@/types';

interface AuthUser {
  id:       string;
  name:     string;
  email:    string;
  role:     UserRole;
  initials: string;
}

interface AuthState {
  user:       AuthUser | null;
  isAuthed:   boolean;
  login:      (user: AuthUser, accessToken: string) => void;
  logout:     () => void;
  hasRole:    (required: UserRole[]) => boolean;
  canWrite:   () => boolean;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    (set, get) => ({
      user:     null,
      isAuthed: false,

      login: (user, accessToken) => {
        setAccessToken(accessToken);
        set({ user, isAuthed: true }, false, 'login');
      },

      logout: () => {
        setAccessToken(null);
        set({ user: null, isAuthed: false }, false, 'logout');
      },

      // RBAC guard
      hasRole: (required) => {
        const { user } = get();
        return user !== null && required.includes(user.role);
      },

      // Convenience: read-only users can't mutate
      canWrite: () => get().hasRole(['Admin', 'Recruiter']),
    }),
    { name: 'AuthStore' },
  ),
);

// Listen for token expiry events from the API client
if (typeof window !== 'undefined') {
  window.addEventListener('auth:logout', () => useAuthStore.getState().logout());
}
