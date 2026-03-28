/**
 * Performance monitoring -- tracks key metrics for Ember.
 * Uses the browser Performance API and custom marks/measures.
 */
import { log } from './logger';
import { trackWebVital } from './analytics';

export interface PerfMetric {
  name: string;
  value: number;
  timestamp: number;
  type: 'mark' | 'measure' | 'interaction' | 'render' | 'vital';
}

const METRIC_BUFFER_LIMIT = 100;
const metrics: PerfMetric[] = [];

function pushMetric(metric: PerfMetric): void {
  metrics.push(metric);
  if (metrics.length > METRIC_BUFFER_LIMIT) {
    metrics.shift();
  }
}

/** Mark a point in time. */
export function mark(name: string): void {
  performance.mark(name);
  pushMetric({ name, value: performance.now(), timestamp: Date.now(), type: 'mark' });
}

/** Measure duration between two marks. Returns ms. */
export function measure(name: string, startMark: string, endMark?: string): number {
  try {
    const entry = performance.measure(name, startMark, endMark);
    const duration = entry.duration;
    pushMetric({ name, value: duration, timestamp: Date.now(), type: 'measure' });
    return duration;
  } catch {
    log.warn('Failed to measure performance', { name, startMark });
    return 0;
  }
}

/** Track a critical user interaction timing. */
export function trackInteraction(name: string, durationMs: number): void {
  pushMetric({ name, value: durationMs, timestamp: Date.now(), type: 'interaction' });
  log.debug('Interaction tracked', { name, durationMs });
}

const FRAME_BUDGET_MS = 16;

/** Track component render time. Returns a stop function. */
export function trackRender(componentName: string): () => void {
  const start = performance.now();
  return () => {
    const duration = performance.now() - start;
    pushMetric({
      name: `render:${componentName}`,
      value: duration,
      timestamp: Date.now(),
      type: 'render',
    });
    if (duration > FRAME_BUDGET_MS) {
      log.warn('Slow render detected', { component: componentName, durationMs: Math.round(duration) });
    }
  };
}

/** Report Web Vitals (LCP, FID, CLS, TTFB, INP). */
export function reportWebVitals(): void {
  if (typeof PerformanceObserver === 'undefined') return;

  const observe = (type: string, callback: (entry: PerformanceEntry) => void): void => {
    try {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach(callback);
      });
      observer.observe({ type, buffered: true });
    } catch {
      // Observer type not supported in this browser
    }
  };

  observe('largest-contentful-paint', (entry) => {
    const metric: PerfMetric = {
      name: 'LCP',
      value: entry.startTime,
      timestamp: Date.now(),
      type: 'vital',
    };
    pushMetric(metric);
    const lcpMs = Math.round(entry.startTime);
    log.info('Web Vital: LCP', { valueMs: lcpMs });
    trackWebVital('LCP', lcpMs, lcpMs < 2500 ? 'good' : lcpMs < 4000 ? 'needs-improvement' : 'poor');
  });

  observe('first-input', (entry) => {
    const fid = (entry as PerformanceEventTiming).processingStart - entry.startTime;
    const metric: PerfMetric = { name: 'FID', value: fid, timestamp: Date.now(), type: 'vital' };
    pushMetric(metric);
    const fidMs = Math.round(fid);
    log.info('Web Vital: FID', { valueMs: fidMs });
    trackWebVital('FID', fidMs, fidMs < 100 ? 'good' : fidMs < 300 ? 'needs-improvement' : 'poor');
  });

  observe('layout-shift', (entry) => {
    const lsEntry = entry as PerformanceEntry & { hadRecentInput: boolean; value: number };
    if (!lsEntry.hadRecentInput) {
      const metric: PerfMetric = {
        name: 'CLS',
        value: lsEntry.value,
        timestamp: Date.now(),
        type: 'vital',
      };
      pushMetric(metric);
    }
  });

  observe('longtask', (entry) => {
    log.warn('Long task detected', { durationMs: Math.round(entry.duration) });
  });

  // TTFB from navigation timing
  const navEntries = performance.getEntriesByType('navigation');
  if (navEntries.length > 0) {
    const nav = navEntries[0] as PerformanceNavigationTiming;
    const ttfb = nav.responseStart - nav.requestStart;
    pushMetric({ name: 'TTFB', value: ttfb, timestamp: Date.now(), type: 'vital' });
    const ttfbMs = Math.round(ttfb);
    log.info('Web Vital: TTFB', { valueMs: ttfbMs });
    trackWebVital('TTFB', ttfbMs, ttfbMs < 800 ? 'good' : ttfbMs < 1800 ? 'needs-improvement' : 'poor');
  }
}

/** Get all collected metrics. */
export function getMetrics(): PerfMetric[] {
  return [...metrics];
}
