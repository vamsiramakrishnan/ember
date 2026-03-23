/**
 * ErrorBoundary — catches render errors in the component tree.
 * Displays a quiet, on-brand recovery message instead of a blank screen.
 * Provides a "Try again" button that resets the boundary.
 */
import { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';
import styles from './ErrorBoundary.module.css';

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
        <div className={styles.container}>
          <p className={styles.title}>
            Something went quiet.
          </p>
          <p className={styles.message}>
            A rendering error occurred. Your work is safe in the notebook.
          </p>
          <button
            onClick={this.handleReset}
            className={styles.resetButton}
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
