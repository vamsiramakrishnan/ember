/**
 * ErrorBoundary — catches render errors in the component tree.
 * Displays a quiet, on-brand recovery message instead of a blank screen.
 * Provides a "Try again" button that resets the boundary.
 */
import { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
  /** Optional fallback UI. If omitted, uses the default quiet message. */
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[Ember] Render error:', error, info.componentStack);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div style={{
          maxWidth: 640,
          margin: '80px auto',
          padding: '0 24px',
          fontFamily: 'var(--font-student)',
          color: 'var(--ink-soft)',
          textAlign: 'center',
          lineHeight: 1.75,
        }}>
          <p style={{
            fontFamily: 'var(--font-tutor)',
            fontSize: 20,
            fontWeight: 300,
            color: 'var(--ink)',
            marginBottom: 16,
          }}>
            Something went quiet.
          </p>
          <p style={{ fontSize: 15, marginBottom: 24 }}>
            A rendering error occurred. Your work is safe in the notebook.
          </p>
          <button
            onClick={this.handleReset}
            style={{
              fontFamily: 'var(--font-system)',
              fontSize: 12,
              color: 'var(--ink-faint)',
              background: 'none',
              border: '1px solid var(--rule)',
              borderRadius: 2,
              padding: '8px 20px',
              cursor: 'pointer',
              letterSpacing: 1,
              textTransform: 'uppercase',
            }}
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
