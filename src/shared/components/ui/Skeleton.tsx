/**
 * Skeleton — Loading placeholder components
 * ──────────────────────────────────────────
 * Used as Suspense fallbacks and loading states.
 * Each variant matches the shape of the real content to reduce layout shift.
 */

import { memo } from 'react';

interface SkeletonProps {
  width?:   string | number;
  height?:  string | number;
  radius?:  number;
  animate?: boolean;
  style?:   React.CSSProperties;
}

const PULSE_STYLE: React.CSSProperties = {
  animation: 'pulse 1.5s ease-in-out infinite',
};

export const Skeleton = memo(function Skeleton({
  width   = '100%',
  height  = 16,
  radius  = 6,
  animate = true,
  style   = {},
}: SkeletonProps): JSX.Element {
  return (
    <div
      aria-hidden="true"
      style={{
        width, height, borderRadius: radius,
        background: 'var(--bg3)',
        ...(animate ? PULSE_STYLE : {}),
        ...style,
      }}
    />
  );
});

/** Stat card skeleton — matches the shape of dashboard stat cards */
export function StatCardSkeleton(): JSX.Element {
  return (
    <div className="stat" aria-hidden="true">
      <Skeleton height={10} width="60%" style={{ marginBottom: 14 }} />
      <Skeleton height={36} width="50%" style={{ marginBottom: 8 }} />
      <Skeleton height={10} width="80%" />
    </div>
  );
}

/** Candidate row skeleton */
export function CandidateRowSkeleton(): JSX.Element {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '32px 1fr 110px 140px 90px 70px 70px', gap: 10, padding: '12px 16px', borderBottom: '1px solid var(--bor)', alignItems: 'center' }} aria-hidden="true">
      <Skeleton height={28} width={28} radius={8} />
      <div>
        <Skeleton height={12} width="60%" style={{ marginBottom: 6 }} />
        <Skeleton height={10} width="80%" />
      </div>
      <Skeleton height={20} width={90} radius={10} />
      <Skeleton height={12} width="70%" />
      <Skeleton height={20} width={70} radius={4} />
      <div style={{ display: 'flex', gap: 3 }}>
        {[1,2,3,4,5].map(i => <Skeleton key={i} height={8} width={8} radius={2} />)}
      </div>
      <Skeleton height={10} width={40} />
    </div>
  );
}

/** Dashboard view skeleton */
export function DashboardSkeleton(): JSX.Element {
  return (
    <div className="view" aria-busy="true" aria-label="Loading dashboard">
      <div style={{ marginBottom: 24 }}>
        <Skeleton height={12} width={80} style={{ marginBottom: 8 }} />
        <Skeleton height={40} width={320} style={{ marginBottom: 6 }} />
        <Skeleton height={12} width={240} />
      </div>
      <div className="stats-row">
        {[1,2,3,4].map(i => <StatCardSkeleton key={i} />)}
      </div>
      <div className="two-col" style={{ marginBottom: 14 }}>
        <Skeleton height={200} radius={12} />
        <Skeleton height={200} radius={12} />
      </div>
      <Skeleton height={220} radius={12} />
    </div>
  );
}

/** Candidates page skeleton */
export function CandidatesSkeleton(): JSX.Element {
  return (
    <div className="view" aria-busy="true" aria-label="Loading candidates">
      <div style={{ marginBottom: 24 }}>
        <Skeleton height={12} width={80} style={{ marginBottom: 8 }} />
        <Skeleton height={36} width={200} style={{ marginBottom: 6 }} />
        <Skeleton height={12} width={180} />
      </div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {[1,2,3,4,5,6].map(i => <Skeleton key={i} height={30} width={80} radius={6} />)}
      </div>
      <div className="card">
        {[1,2,3,4,5,6,7,8].map(i => <CandidateRowSkeleton key={i} />)}
      </div>
    </div>
  );
}
