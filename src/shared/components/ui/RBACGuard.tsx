/**
 * RBACGuard — Role-Based Access Control UI Guard
 * ─────────────────────────────────────────────────
 * Conditionally renders children based on the user's role.
 * Server-side enforcement is always the primary control —
 * this just hides UI elements for a better UX.
 *
 * @example
 * <RBACGuard allow={['Admin', 'Recruiter']}>
 *   <button onClick={postJob}>Post Job</button>
 * </RBACGuard>
 *
 * @example
 * <RBACGuard allow={['Admin']} fallback={<ReadOnlyBanner />}>
 *   <SettingsPanel />
 * </RBACGuard>
 */

import { type ReactNode, memo } from 'react';
import { useAuthStore }         from '@/features/auth/store/authStore';
import type { UserRole }        from '@/types';

interface Props {
  /** Roles that are allowed to see the children */
  allow:    UserRole[];
  /** What to render when access is denied (default: nothing) */
  fallback?: ReactNode;
  children:  ReactNode;
}

export const RBACGuard = memo(function RBACGuard({ allow, fallback = null, children }: Props): JSX.Element {
  const hasRole = useAuthStore(s => s.hasRole);
  return hasRole(allow) ? <>{children}</> : <>{fallback}</>;
});

/**
 * ReadOnlyBanner — shown to read-only users when they try to access a write action
 */
export function ReadOnlyBanner(): JSX.Element {
  return (
    <div
      role="alert"
      className="rbac-banner"
      aria-label="Read-only access"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      You have read-only access. Contact an admin to make changes.
    </div>
  );
}
