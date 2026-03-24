import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SearchInput } from '../SearchInput';

describe('SearchInput', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(()  => { vi.useRealTimers(); });

  it('renders an input with type=search', () => {
    render(<SearchInput onSearch={vi.fn()} />);
    expect(screen.getByRole('searchbox')).toBeInTheDocument();
  });

  it('uses placeholder text', () => {
    render(<SearchInput onSearch={vi.fn()} placeholder="Find candidates…" />);
    expect(screen.getByPlaceholderText('Find candidates…')).toBeInTheDocument();
  });

  it('renders a visually-hidden label', () => {
    render(<SearchInput onSearch={vi.fn()} placeholder="Search" />);
    // The label is visually hidden but present for screen readers
    expect(screen.getByText('Search')).toBeInTheDocument();
  });

  it('shows clear button when text is typed', () => {
    render(<SearchInput onSearch={vi.fn()} />);
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'hello' } });
    expect(screen.getByRole('button', { name: 'Clear search' })).toBeInTheDocument();
  });

  it('does not show clear button initially', () => {
    render(<SearchInput onSearch={vi.fn()} />);
    expect(screen.queryByRole('button', { name: 'Clear search' })).not.toBeInTheDocument();
  });

  it('hides clear button when clearable=false', () => {
    render(<SearchInput onSearch={vi.fn()} clearable={false} />);
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'test' } });
    expect(screen.queryByRole('button', { name: 'Clear search' })).not.toBeInTheDocument();
  });

  it('clears input when clear button is clicked', () => {
    render(<SearchInput onSearch={vi.fn()} />);
    const input = screen.getByRole('searchbox');
    fireEvent.change(input, { target: { value: 'hello' } });
    fireEvent.click(screen.getByRole('button', { name: 'Clear search' }));
    expect((input as HTMLInputElement).value).toBe('');
  });

  it('has autocomplete=off', () => {
    render(<SearchInput onSearch={vi.fn()} />);
    expect(screen.getByRole('searchbox')).toHaveAttribute('autocomplete', 'off');
  });
});
