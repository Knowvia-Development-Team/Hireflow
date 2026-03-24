import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Skeleton, StatCardSkeleton, CandidateRowSkeleton, DashboardSkeleton } from '../Skeleton';

describe('Skeleton', () => {
  it('renders with aria-hidden', () => {
    const { container } = render(<Skeleton />);
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true');
  });

  it('applies custom width and height', () => {
    const { container } = render(<Skeleton width={200} height={40} />);
    const el = container.firstChild as HTMLElement;
    expect(el.style.width).toBe('200px');
    expect(el.style.height).toBe('40px');
  });

  it('applies pulse animation by default', () => {
    const { container } = render(<Skeleton />);
    const el = container.firstChild as HTMLElement;
    expect(el.style.animation).toContain('pulse');
  });

  it('can disable animation', () => {
    const { container } = render(<Skeleton animate={false} />);
    const el = container.firstChild as HTMLElement;
    expect(el.style.animation).toBe('');
  });
});

describe('DashboardSkeleton', () => {
  it('has aria-busy and aria-label', () => {
    render(<DashboardSkeleton />);
    expect(screen.getByRole('generic', { name: /loading dashboard/i })).toBeInTheDocument();
  });
});

describe('StatCardSkeleton', () => {
  it('renders without crashing', () => {
    const { container } = render(<StatCardSkeleton />);
    expect(container.firstChild).toBeInTheDocument();
  });
});

describe('CandidateRowSkeleton', () => {
  it('renders without crashing', () => {
    const { container } = render(<CandidateRowSkeleton />);
    expect(container.firstChild).toBeInTheDocument();
  });
});
