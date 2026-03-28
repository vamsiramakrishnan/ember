import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setBackgroundResults, consumeBackgroundResults } from '../background-results';

describe('background-results', () => {
  beforeEach(() => {
    // Clear by consuming
    consumeBackgroundResults();
  });

  it('returns null when no results have been set', () => {
    expect(consumeBackgroundResults()).toBeNull();
  });

  it('returns results after they are set', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1000);
    setBackgroundResults({ newThinkers: ['Kepler'] });

    const results = consumeBackgroundResults();
    expect(results).not.toBeNull();
    expect(results?.newThinkers).toEqual(['Kepler']);
    expect(results?.updatedAt).toBe(1000);
    vi.restoreAllMocks();
  });

  it('clears results after consumption', () => {
    setBackgroundResults({ newTerms: ['harmonic'] });
    consumeBackgroundResults();
    expect(consumeBackgroundResults()).toBeNull();
  });

  it('merges partial updates with existing state', () => {
    setBackgroundResults({ newThinkers: ['Euler'] });
    setBackgroundResults({ newTerms: ['calculus'] });

    const results = consumeBackgroundResults();
    expect(results?.newThinkers).toEqual(['Euler']);
    expect(results?.newTerms).toEqual(['calculus']);
  });

  it('preserves default empty arrays for unset fields', () => {
    setBackgroundResults({ newThinkers: ['Gauss'] });

    const results = consumeBackgroundResults();
    expect(results?.newTerms).toEqual([]);
    expect(results?.masteryChanges).toEqual([]);
  });

  it('handles masteryChanges updates', () => {
    const changes = [{ concept: 'ratios', from: 20, to: 45 }];
    setBackgroundResults({ masteryChanges: changes });

    const results = consumeBackgroundResults();
    expect(results?.masteryChanges).toEqual(changes);
  });
});
