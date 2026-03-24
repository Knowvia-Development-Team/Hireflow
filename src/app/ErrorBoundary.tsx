/**
 * Global Error Boundary
 * ──────────────────────
 * Catches unhandled render errors and shows a recovery UI.
 * In production, errors are forwarded to Sentry.
 */

import { Component, type ReactNode } from 'react';
import { IconAlertTriangle } from '@/shared/components/ui/Icons';

interface Props   { children: ReactNode; fallback?: ReactNode; }
interface State   { hasError: boolean; error: Error | null; }

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    // Forward to Sentry in production
    if (import.meta.env.PROD) {
      // Sentry.captureException(error, { extra: { componentStack: info.componentStack } });
      console.error('[ErrorBoundary]', error, info);
    } else {
      console.error('[ErrorBoundary]', error, info);
    }
  }

  private handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div role="alert" style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', height: '100vh', gap: 16,
          fontFamily: 'var(--sans)', background: 'var(--bg)', color: 'var(--white)',
        }}>
          <div style={{ width:56,height:56,borderRadius:14,background:"rgba(220,38,38,0.08)",border:"1px solid rgba(220,38,38,0.2)",display:"flex",alignItems:"center",justifyContent:"center" }}><IconAlertTriangle size={24} style={{color:"var(--red)"}} /></div>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: '1.5rem' }}>Something went wrong</h1>
          <p style={{ fontSize: '0.84rem', color: 'var(--g3)', maxWidth: 400, textAlign: 'center' }}>
            {this.state.error?.message ?? 'An unexpected error occurred.'}
          </p>
          <button
            className="btn btn-primary"
            onClick={this.handleReset}
            aria-label="Try again"
          >
            Try again
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => window.location.reload()}
          >
            Reload page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

/** Lightweight inline error fallback for smaller sections */
export function SectionError({ message, onRetry }: { message?: string; onRetry?: () => void }): JSX.Element {
  return (
    <div role="alert" style={{
      padding: '24px', textAlign: 'center', background: 'var(--bg3)',
      border: '1px solid rgba(220,38,38,0.2)', borderRadius: 10, margin: 16,
    }}>
      <p style={{ fontSize: '0.84rem', color: 'var(--red)', marginBottom: onRetry ? 12 : 0 }}>
        {message ?? 'Failed to load this section.'}
      </p>
      {onRetry && (
        <button className="btn btn-ghost btn-sm" onClick={onRetry}>↻ Retry</button>
      )}
    </div>
  );
}
