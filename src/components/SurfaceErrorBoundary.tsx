/**
 * SurfaceErrorBoundary — granular error boundary for individual surfaces.
 * Catches render errors within a single surface and offers quiet recovery
 * without tearing down the entire application shell.
 */
import { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';
import styles from './SurfaceErrorBoundary.module.css';

interface Props {
  children: ReactNode;
  /** Display name of the surface, shown in the recovery message. */
  surface: string;
  /** Called when the user clicks the recovery button. */
  onRecover: () => void;
}

interface State {
  hasError: boolean;
}

export class SurfaceErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    try {
      // Dynamic import to avoid circular dependency — observability may not be loaded yet
      import('@/observability').then(({ captureError }) => {
        captureError(error, {
          surface: this.props.surface,
          componentStack: info.componentStack ?? undefined,
        });
      }).catch(() => {
        // Observability not available — fall through to console
      });
    } catch {
      // Swallow — never let logging break recovery
    }
    console.error(
      `[Ember] Error in ${this.props.surface}:`,
      error,
      info.componentStack,
    );
  }

  private handleRecover = () => {
    this.setState({ hasError: false });
    this.props.onRecover();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className={styles.container} role="alert">
        <p className={styles.title}>
          The {this.props.surface} needs a moment.
        </p>
        <p className={styles.message}>
          Something unexpected happened while rendering this surface.
          Your notes are safe.
        </p>
        <button
          onClick={this.handleRecover}
          className={styles.recoverButton}
          type="button"
        >
          Return to notebook
        </button>
      </div>
    );
  }
}
