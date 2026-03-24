import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FormField } from '../FormField';

describe('FormField', () => {
  it('renders a label associated with the input by id', () => {
    render(
      <FormField id="email" label="Email Address">
        <input id="email" type="email" />
      </FormField>,
    );
    const label = screen.getByText('Email Address');
    expect(label).toHaveAttribute('for', 'email');
  });

  it('shows required asterisk when required=true', () => {
    render(
      <FormField id="f1" label="Name" required>
        <input id="f1" />
      </FormField>,
    );
    // The asterisk is aria-hidden; the screen-reader text is visually hidden
    expect(screen.getByText('(required)')).toBeInTheDocument();
  });

  it('does not show required marker when required=false', () => {
    render(
      <FormField id="f2" label="Optional Field">
        <input id="f2" />
      </FormField>,
    );
    expect(screen.queryByText('(required)')).not.toBeInTheDocument();
  });

  it('renders error message with role=alert', () => {
    render(
      <FormField id="f3" label="Title" error="Title is required">
        <input id="f3" />
      </FormField>,
    );
    const error = screen.getByRole('alert');
    expect(error).toHaveTextContent('Title is required');
  });

  it('does not render error element when no error', () => {
    render(
      <FormField id="f4" label="Clean Field">
        <input id="f4" />
      </FormField>,
    );
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('renders hint text when provided', () => {
    render(
      <FormField id="f5" label="Skills" hint="Comma-separated list">
        <input id="f5" />
      </FormField>,
    );
    expect(screen.getByText('Comma-separated list')).toBeInTheDocument();
  });

  it('renders children correctly', () => {
    render(
      <FormField id="f6" label="Custom Field">
        <textarea id="f6" data-testid="ta" />
      </FormField>,
    );
    expect(screen.getByTestId('ta')).toBeInTheDocument();
  });
});
