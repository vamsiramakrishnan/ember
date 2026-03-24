/**
 * Observability -- public API for logging, error tracking,
 * performance monitoring, and analytics.
 */

export { log, createLogger } from './logger';
export type { LogLevel, LogContext, Logger } from './logger';
export { initSentry, captureError, captureMessage, setUser, clearUser } from './sentry';
export { mark, measure, trackInteraction, trackRender, reportWebVitals } from './perf';
export type { PerfMetric } from './perf';
export { initAnalytics, trackEvent } from './analytics';

import { initSentry } from './sentry';
import { initAnalytics } from './analytics';
import { reportWebVitals } from './perf';

/** Initialize all observability systems. Call once at app startup. */
export function initObservability(): void {
  initSentry();
  initAnalytics();
  reportWebVitals();
}
