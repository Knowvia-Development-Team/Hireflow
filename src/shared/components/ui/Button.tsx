/**
 * Button — Accessible, typed, memoised
 * ──────────────────────────────────────
 * Single source of truth for all button variants.
 * Enforces WCAG 2.1 AA focus ring and aria-* attributes.
 */

import { memo, type ButtonHTMLAttributes } from 'react';

export type ButtonVariant = 'primary' | 'ghost' | 'danger' | 'success' | 'warning';
export type ButtonSize    = 'sm' | 'md';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?:    ButtonSize;
  loading?: boolean;
}

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: 'btn-primary',
  ghost:   'btn-ghost',
  danger:  'btn-danger',
  success: 'btn-success',
  warning: 'btn-warning',
};

export const Button = memo(function Button({
  variant  = 'ghost',
  size     = 'md',
  loading  = false,
  disabled,
  children,
  className = '',
  ...rest
}: Props): JSX.Element {
  const cls = [
    'btn',
    VARIANT_CLASS[variant],
    size === 'sm' ? 'btn-sm' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <button
      {...rest}
      className={cls}
      disabled={disabled ?? loading}
      aria-busy={loading}
      aria-disabled={disabled ?? loading}
    >
      {loading ? (
        <span aria-hidden="true" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            style={{ animation: 'spin 1s linear infinite' }}>
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
          {children}
        </span>
      ) : children}
    </button>
  );
});
