/**
 * Vercel Analytics + Speed Insights — page views, custom events, Core Web Vitals.
 *
 * was: @vercel/analytics inject() only (page views)
 * now: + @vercel/speed-insights for CWV in Vercel dashboard
 *      + trackEvent wired to domain events
 *      + Web Vitals forwarded as custom analytics events
 */
import { inject, track as vercelTrack } from '@vercel/analytics';
import { injectSpeedInsights } from '@vercel/speed-insights';

let initialized = false;

/** Initialize Vercel Analytics + Speed Insights. Call once at startup. */
export function initAnalytics(): void {
  if (initialized) return;
  inject();
  injectSpeedInsights();
  initialized = true;
}

/** Track a custom event — appears in Vercel Analytics > Events. */
export function trackEvent(
  name: string,
  properties?: Record<string, string | number | boolean>,
): void {
  if (!initialized) return;
  vercelTrack(name, properties);
}

/**
 * Forward a Web Vital metric to Vercel Analytics as a custom event.
 * This makes CWV visible in both the Speed Insights tab AND as trackable events.
 */
export function trackWebVital(
  name: string,
  value: number,
  rating?: 'good' | 'needs-improvement' | 'poor',
): void {
  if (!initialized) return;
  vercelTrack('web-vital', {
    metric: name,
    value: Math.round(value),
    ...(rating ? { rating } : {}),
  });
}
