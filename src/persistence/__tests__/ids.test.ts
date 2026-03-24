/**
 * Tests for ID generation — uniqueness, sortability, and order helpers.
 */
import { describe, test, expect } from 'vitest';
import { createId, midpoint, nextOrder } from '../ids';

describe('createId', () => {
  test('returns a string', () => {
    expect(typeof createId()).toBe('string');
  });

  test('returns unique IDs', () => {
    const ids = new Set(Array.from({ length: 100 }, () => createId()));
    expect(ids.size).toBe(100);
  });

  test('IDs are roughly sortable by time', async () => {
    const id1 = createId();
    // Small delay to ensure different timestamp
    await new Promise((r) => setTimeout(r, 5));
    const id2 = createId();
    // The timestamp prefix (before the dash) should sort correctly
    expect(id1 < id2).toBe(true);
  });

  test('contains a hyphen separator', () => {
    const id = createId();
    expect(id).toContain('-');
  });
});

describe('midpoint', () => {
  test('returns the midpoint of two numbers', () => {
    expect(midpoint(0, 10)).toBe(5);
    expect(midpoint(1, 3)).toBe(2);
    expect(midpoint(2.0, 3.0)).toBe(2.5);
  });
});

describe('nextOrder', () => {
  test('returns 1 when lastOrder is undefined', () => {
    expect(nextOrder(undefined)).toBe(1);
  });

  test('increments by 1', () => {
    expect(nextOrder(1)).toBe(2);
    expect(nextOrder(5)).toBe(6);
    expect(nextOrder(10.5)).toBe(11.5);
  });
});
