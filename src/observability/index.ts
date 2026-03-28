/**
 * Observability — public API for logging, error tracking,
 * performance monitoring, analytics, and distributed tracing.
 */

export { log, createLogger } from './logger';
export type { LogLevel, LogContext, Logger } from './logger';
export { initSentry, captureError, captureMessage, setUser, clearUser } from './sentry';
export { mark, measure, trackInteraction, trackRender, reportWebVitals } from './perf';
export type { PerfMetric } from './perf';
export { initAnalytics, trackEvent, trackWebVital } from './analytics';
export { initOtel, traced, tracedSync, getTracer, isOtelEnabled } from './otel';
export {
  traceAgentDispatch, traceDbOp, traceCrdtSync,
  traceSurfaceRender, traceInteraction,
} from './telemetry';

import { initSentry } from './sentry';
import { initAnalytics } from './analytics';
import { reportWebVitals } from './perf';
import { initOtel } from './otel';

/** Initialize all observability systems. Call once at app startup. */
export function initObservability(): void {
  initOtel();
  initSentry();
  initAnalytics();
  reportWebVitals();
}
