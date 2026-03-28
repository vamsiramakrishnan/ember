/**
 * Tests for cross-notebook-bridge — discovers connections between notebooks.
 */
import { describe, test, expect, vi, beforeEach } from 'vitest';

vi.mock('@/persistence/engine', () => ({
  getAll: vi.fn().mockResolvedValue([]),
}));

import { findCrossNotebookBridges } from '../cross-notebook-bridge';
import { getAll } from '@/persistence/engine';

const mockedGetAll = vi.mocked(getAll);

describe('cross-notebook-bridge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('returns empty when current notebook not found', async () => {
    mockedGetAll.mockResolvedValue([]);
    const result = await findCrossNotebookBridges('s1', 'missing');
    expect(result).toEqual([]);
  });

  test('finds concept overlap across notebooks', async () => {
    mockedGetAll.mockImplementation(async (store) => {
      if (store === 'notebooks') return [
        { id: 'nb1', studentId: 's1', title: 'Music' },
        { id: 'nb2', studentId: 's1', title: 'Physics' },
      ];
      if (store === 'mastery') return [
        { id: 'm1', studentId: 's1', notebookId: 'nb1', concept: 'Ratio' },
        { id: 'm2', studentId: 's1', notebookId: 'nb2', concept: 'Ratio' },
      ];
      return [];
    });
    const result = await findCrossNotebookBridges('s1', 'nb1');
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]!.bridgeType).toBe('concept-overlap');
    expect(result[0]!.concept).toBe('Ratio');
  });

  test('finds thinker overlap across notebooks', async () => {
    mockedGetAll.mockImplementation(async (store) => {
      if (store === 'notebooks') return [
        { id: 'nb1', studentId: 's1', title: 'Music' },
        { id: 'nb2', studentId: 's1', title: 'Astronomy' },
      ];
      if (store === 'mastery') return [];
      if (store === 'encounters') return [
        { id: 'e1', studentId: 's1', notebookId: 'nb1', thinker: 'Kepler' },
        { id: 'e2', studentId: 's1', notebookId: 'nb2', thinker: 'Kepler' },
      ];
      return [];
    });
    const result = await findCrossNotebookBridges('s1', 'nb1');
    const thinkerBridges = result.filter((b) => b.bridgeType === 'thinker-overlap');
    expect(thinkerBridges).toHaveLength(1);
    expect(thinkerBridges[0]!.confidence).toBe(0.9);
  });

  test('finds term overlap across notebooks', async () => {
    mockedGetAll.mockImplementation(async (store) => {
      if (store === 'notebooks') return [
        { id: 'nb1', studentId: 's1', title: 'Music' },
        { id: 'nb2', studentId: 's1', title: 'Language' },
      ];
      if (store === 'mastery') return [];
      if (store === 'encounters') return [];
      if (store === 'lexicon') return [
        { id: 'l1', studentId: 's1', notebookId: 'nb1', term: 'harmony' },
        { id: 'l2', studentId: 's1', notebookId: 'nb2', term: 'Harmony' },
      ];
      return [];
    });
    const result = await findCrossNotebookBridges('s1', 'nb1');
    const termBridges = result.filter((b) => b.bridgeType === 'term-overlap');
    expect(termBridges).toHaveLength(1);
  });

  test('deduplicates bridges', async () => {
    mockedGetAll.mockImplementation(async (store) => {
      if (store === 'notebooks') return [
        { id: 'nb1', studentId: 's1', title: 'Music' },
        { id: 'nb2', studentId: 's1', title: 'Physics' },
      ];
      if (store === 'mastery') return [
        { id: 'm1', studentId: 's1', notebookId: 'nb1', concept: 'Ratio' },
        { id: 'm2', studentId: 's1', notebookId: 'nb2', concept: 'Ratio' },
        { id: 'm3', studentId: 's1', notebookId: 'nb2', concept: 'ratio' },
      ];
      return [];
    });
    const result = await findCrossNotebookBridges('s1', 'nb1');
    const ratios = result.filter((b) => b.concept === 'Ratio');
    expect(ratios).toHaveLength(1);
  });

  test('sorts by confidence descending', async () => {
    mockedGetAll.mockImplementation(async (store) => {
      if (store === 'notebooks') return [
        { id: 'nb1', studentId: 's1', title: 'Music' },
        { id: 'nb2', studentId: 's1', title: 'Physics' },
      ];
      if (store === 'mastery') return [
        { id: 'm1', studentId: 's1', notebookId: 'nb1', concept: 'Test' },
        { id: 'm2', studentId: 's1', notebookId: 'nb2', concept: 'Test' },
      ];
      if (store === 'encounters') return [
        { id: 'e1', studentId: 's1', notebookId: 'nb1', thinker: 'Kepler' },
        { id: 'e2', studentId: 's1', notebookId: 'nb2', thinker: 'Kepler' },
      ];
      return [];
    });
    const result = await findCrossNotebookBridges('s1', 'nb1');
    for (let i = 1; i < result.length; i++) {
      expect(result[i - 1]!.confidence).toBeGreaterThanOrEqual(result[i]!.confidence);
    }
  });
});
