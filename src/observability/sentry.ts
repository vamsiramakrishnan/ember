/**
 * Sentry integration -- error tracking and performance monitoring.
 * Only initializes if VITE_SENTRY_DSN is set.
 * Uses @sentry/react for React error boundary integration.
 */
import * as Sentry from '@sentry/react';

let initialized = false;

function isEnabled(): boolean {
  return typeof import.meta !== 'undefined' &&
    !!import.meta.env?.VITE_SENTRY_DSN;
}

/** Initialize Sentry. Call once at app startup. */
export function initSentry(): void {
  if (!isEnabled() || initialized) return;

  const dsn = import.meta.env.VITE_SENTRY_DSN as string;
  const environment = import.meta.env.MODE ?? 'development';
  const release = (import.meta.env.VITE_APP_VERSION as string | undefined) ?? 'dev';

  Sentry.init({
    dsn,
    environment,
    release,
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
  });

  initialized = true;
}

/** Capture an error with context. */
export function captureError(error: Error, context?: Record<string, unknown>): void {
  if (!initialized) return;
  Sentry.withScope((scope) => {
    if (context) {
      scope.setExtras(context);
    }
    Sentry.captureException(error);
  });
}

/** Capture a message. */
export function captureMessage(
  message: string,
  level?: 'info' | 'warning' | 'error',
): void {
  if (!initialized) return;
  Sentry.captureMessage(message, level ?? 'info');
}

/** Set user context for all subsequent events. */
export function setUser(id: string, name?: string): void {
  if (!initialized) return;
  Sentry.setUser({ id, username: name });
}

/** Clear user context. */
export function clearUser(): void {
  if (!initialized) return;
  Sentry.setUser(null);
}

/** Create a performance transaction. Returns a handle with a finish method. */
export function startTransaction(
  name: string,
  op: string,
): { finish: () => void } {
  if (!initialized) {
    return { finish: () => {} };
  }
  const span = Sentry.startInactiveSpan({ name, op, forceTransaction: true });
  if (span) {
    return { finish: () => span.end() };
  }
  return { finish: () => {} };
}

/** Add breadcrumb to Sentry. */
export function addBreadcrumb(
  category: string,
  message: string,
  data?: Record<string, unknown>,
): void {
  if (!initialized) return;
  Sentry.addBreadcrumb({ category, message, data, level: 'info' });
}
