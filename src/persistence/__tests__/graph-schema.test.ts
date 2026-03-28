/**
 * Tests for graph-schema — backward-compatible re-exports.
 */
import { describe, test, expect } from 'vitest';
import { GraphStore } from '../graph-schema';

describe('graph-schema', () => {
  test('GraphStore.Relations maps to relations', () => {
    expect(GraphStore.Relations).toBe('relations');
  });

  test('GraphStore.Events maps to events', () => {
    expect(GraphStore.Events).toBe('events');
  });
});
