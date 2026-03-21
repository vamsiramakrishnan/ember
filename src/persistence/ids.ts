/**
 * ID generation — compact, unique, time-sortable identifiers.
 * Format: base36 timestamp + random suffix.
 * Collision-resistant for single-user client-side use.
 */

/** Generate a unique ID. Roughly sortable by creation time. */
export function createId(): string {
  const time = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `${time}-${rand}`;
}

/** Generate a fractional order index between two values. */
export function midpoint(a: number, b: number): number {
  return (a + b) / 2;
}

/**
 * Generate the next order value after the last entry.
 * Starts at 1.0, increments by 1.0 for simplicity.
 * Use midpoint() when inserting between existing entries.
 */
export function nextOrder(lastOrder: number | undefined): number {
  return (lastOrder ?? 0) + 1;
}
