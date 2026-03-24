import { describe, it, expect, vi } from 'vitest';
import { render, screen }               from '@testing-library/react';
import { VirtualCandidateList }         from '../components/VirtualCandidateList';
import { INITIAL_CANDIDATES }           from '@/data';

describe('VirtualCandidateList', () => {
  it('renders empty-state message for empty array', () => {
    render(<VirtualCandidateList candidates={[]} onSelect={vi.fn()} />);
    expect(screen.getByText('No candidates found.')).toBeInTheDocument();
  });

  it('empty state has role=status', () => {
    render(<VirtualCandidateList candidates={[]} onSelect={vi.fn()} />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders column header row', () => {
    render(<VirtualCandidateList candidates={INITIAL_CANDIDATES} onSelect={vi.fn()} />);
    expect(screen.getByRole('row', { name: /column headers/i })).toBeInTheDocument();
  });

  it('renders at least 6 column headers', () => {
    render(<VirtualCandidateList candidates={INITIAL_CANDIDATES} onSelect={vi.fn()} />);
    expect(screen.getAllByRole('columnheader').length).toBeGreaterThanOrEqual(6);
  });

  it('renders a list container', () => {
    render(<VirtualCandidateList candidates={INITIAL_CANDIDATES} onSelect={vi.fn()} />);
    expect(screen.getByRole('list')).toBeInTheDocument();
  });

  it('accepts an onSelect callback without throwing', () => {
    const onSelect = vi.fn();
    expect(() =>
      render(<VirtualCandidateList candidates={INITIAL_CANDIDATES} onSelect={onSelect} />)
    ).not.toThrow();
  });

  it('renders with mixed stage candidates without error', () => {
    const mixed = INITIAL_CANDIDATES.filter(c =>
      ['Applied', 'Screening', 'Interview', 'Final', 'Offer', 'Rejected'].includes(c.stageKey)
    );
    expect(() =>
      render(<VirtualCandidateList candidates={mixed} onSelect={vi.fn()} />)
    ).not.toThrow();
  });
});
