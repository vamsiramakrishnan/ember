/**
 * Vercel Analytics -- page views and custom events.
 * Uses @vercel/analytics (already installed).
 */
import { inject, track as vercelTrack } from '@vercel/analytics';

let initialized = false;

/** Initialize Vercel Analytics. Call once at startup. */
export function initAnalytics(): void {
  if (initialized) return;
  inject();
  initialized = true;
}

/** Track a custom event. */
export function trackEvent(
  name: string,
  properties?: Record<string, string | number | boolean>,
): void {
  if (!initialized) return;
  vercelTrack(name, properties);
}
