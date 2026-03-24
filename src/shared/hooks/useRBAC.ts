/**
 * RBAC Hook — Role-Based Access Control
 * ───────────────────────────────────────
 * Components use this to conditionally render actions.
 * The actual enforcement happens server-side.
 *
 * @example
 * const { canWrite, hasRole } = useRBAC();
 * {canWrite && <button onClick={postJob}>Post Job</button>}
 */

import { useAuthStore } from '@/features/auth/store/authStore';
import type { UserRole } from '@/types';

export interface RBACHelpers {
  role:     UserRole | null;
  canWrite: boolean;
  canAdmin: boolean;
  hasRole:  (roles: UserRole[]) => boolean;
}

export function useRBAC(): RBACHelpers {
  const { user, hasRole } = useAuthStore();

  return {
    role:     user?.role ?? null,
    canWrite: hasRole(['Admin', 'Recruiter']),
    canAdmin: hasRole(['Admin']),
    hasRole,
  };
}
