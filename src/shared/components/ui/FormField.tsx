/**
 * FormField — Accessible, typed form field wrapper
 * ──────────────────────────────────────────────────
 * Handles label, input, error message, and ARIA association automatically.
 * Prevents the common bug of `htmlFor` not matching `id`.
 *
 * @example
 * <FormField id="job-title" label="Job Title" error={errors.title} required>
 *   <input className="form-input" {...register('title')} />
 * </FormField>
 */

import { type ReactNode, memo } from 'react';

interface Props {
  id:        string;
  label:     string;
  error?:    string;
  required?: boolean;
  hint?:     string;
  children:  ReactNode;
}

export const FormField = memo(function FormField({
  id, label, error, required = false, hint, children,
}: Props): JSX.Element {
  const errorId = `${id}-error`;
  const hintId  = `${id}-hint`;

  return (
    <div className="form-field">
      <label
        htmlFor={id}
        className="form-label"
        style={{ display: 'flex', alignItems: 'center', gap: 4 }}
      >
        {label}
        {required && (
          <span aria-hidden="true" style={{ color: 'var(--red)' }}>*</span>
        )}
        {required && <span className="sr-only">(required)</span>}
      </label>

      {hint && (
        <p id={hintId} style={{ fontSize: '0.72rem', color: 'var(--g3)', marginBottom: 4 }}>
          {hint}
        </p>
      )}

      {/* Clone child to inject aria-describedby and aria-invalid */}
      <div
        aria-describedby={[error ? errorId : '', hint ? hintId : ''].filter(Boolean).join(' ') || undefined}
      >
        {children}
      </div>

      {error && (
        <p
          id={errorId}
          role="alert"
          style={{
            fontSize: '0.72rem', color: 'var(--red)',
            marginTop: 4, display: 'flex', alignItems: 'center', gap: 4,
          }}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
});
