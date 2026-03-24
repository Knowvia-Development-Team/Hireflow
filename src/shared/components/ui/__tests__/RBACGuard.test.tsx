import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen }   from '@testing-library/react';
import { RBACGuard, ReadOnlyBanner } from '../RBACGuard';
import { useAuthStore }     from '@/features/auth/store/authStore';

const ADMIN = { id: 'u1', name: 'Admin User', email: 'a@t.com', role: 'Admin' as const, initials: 'AU' };
const RO    = { id: 'u2', name: 'RO User',    email: 'r@t.com', role: 'Read-only' as const, initials: 'RU' };

describe('RBACGuard', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, isAuthed: false });
  });

  it('renders children for allowed role', () => {
    useAuthStore.getState().login(ADMIN, 'tok');
    render(
      <RBACGuard allow={['Admin']}>
        <button>Post Job</button>
      </RBACGuard>,
    );
    expect(screen.getByRole('button', { name: 'Post Job' })).toBeInTheDocument();
  });

  it('hides children for disallowed role', () => {
    useAuthStore.getState().login(RO, 'tok');
    render(
      <RBACGuard allow={['Admin', 'Recruiter']}>
        <button>Post Job</button>
      </RBACGuard>,
    );
    expect(screen.queryByRole('button', { name: 'Post Job' })).not.toBeInTheDocument();
  });

  it('shows fallback for disallowed role', () => {
    useAuthStore.getState().login(RO, 'tok');
    render(
      <RBACGuard allow={['Admin']} fallback={<span>No access</span>}>
        <button>Admin Action</button>
      </RBACGuard>,
    );
    expect(screen.getByText('No access')).toBeInTheDocument();
    expect(screen.queryByText('Admin Action')).not.toBeInTheDocument();
  });

  it('hides everything when unauthenticated', () => {
    render(
      <RBACGuard allow={['Admin']}>
        <button>Hidden</button>
      </RBACGuard>,
    );
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('allows multiple roles', () => {
    useAuthStore.getState().login({ ...ADMIN, role: 'Recruiter' }, 'tok');
    render(
      <RBACGuard allow={['Admin', 'Recruiter']}>
        <span>Accessible</span>
      </RBACGuard>,
    );
    expect(screen.getByText('Accessible')).toBeInTheDocument();
  });
});

describe('ReadOnlyBanner', () => {
  it('renders with alert role', () => {
    render(<ReadOnlyBanner />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('contains read-only messaging', () => {
    render(<ReadOnlyBanner />);
    expect(screen.getByText(/read-only access/i)).toBeInTheDocument();
  });
});
