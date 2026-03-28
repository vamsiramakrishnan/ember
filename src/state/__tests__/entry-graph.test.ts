/**
 * Tests for entry-graph — mutations, subscriptions, and persistence bridge.
 */
import { describe, test, expect, beforeEach, vi } from 'vitest';

vi.mock('@/persistence/repositories/graph', () => ({
  createRelation: vi.fn().mockResolvedValue({}),
  getByNotebook: vi.fn().mockResolvedValue([]),
}));

import {
  addRelation, addRelations, subscribeGraph, getAllRelations,
  clearGraph, setNotebookContext, loadFromPersistence,
} from '../entry-graph';
import { relations, index, listeners } from '../entry-graph-internals';
import { getByNotebook } from '@/persistence/repositories/graph';

describe('entry-graph', () => {
  beforeEach(() => {
    relations.length = 0;
    index.byFrom.clear();
    index.byTo.clear();
    index.byType.clear();
    listeners.clear();
    setNotebookContext('');
    vi.clearAllMocks();
  });

  describe('addRelation', () => {
    test('adds a relation to the graph', () => {
      addRelation({ from: 'a', to: 'b', type: 'follow-up' });
      expect(getAllRelations()).toHaveLength(1);
    });

    test('deduplicates identical relations', () => {
      addRelation({ from: 'a', to: 'b', type: 'follow-up' });
      addRelation({ from: 'a', to: 'b', type: 'follow-up' });
      expect(getAllRelations()).toHaveLength(1);
    });

    test('allows different types between same nodes', () => {
      addRelation({ from: 'a', to: 'b', type: 'follow-up' });
      addRelation({ from: 'a', to: 'b', type: 'references' });
      expect(getAllRelations()).toHaveLength(2);
    });

    test('emits to listeners on add', () => {
      const listener = vi.fn();
      subscribeGraph(listener);
      addRelation({ from: 'a', to: 'b', type: 'echoes' });
      expect(listener).toHaveBeenCalledTimes(1);
    });

    test('does not emit when duplicate', () => {
      addRelation({ from: 'a', to: 'b', type: 'echoes' });
      const listener = vi.fn();
      subscribeGraph(listener);
      addRelation({ from: 'a', to: 'b', type: 'echoes' });
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('addRelations', () => {
    test('adds batch of relations', () => {
      addRelations([
        { from: 'a', to: 'b', type: 'follow-up' },
        { from: 'c', to: 'd', type: 'references' },
      ]);
      expect(getAllRelations()).toHaveLength(2);
    });

    test('deduplicates within batch', () => {
      addRelations([
        { from: 'a', to: 'b', type: 'follow-up' },
        { from: 'a', to: 'b', type: 'follow-up' },
      ]);
      expect(getAllRelations()).toHaveLength(1);
    });

    test('emits once for batch', () => {
      const listener = vi.fn();
      subscribeGraph(listener);
      addRelations([
        { from: 'a', to: 'b', type: 'follow-up' },
        { from: 'c', to: 'd', type: 'references' },
      ]);
      expect(listener).toHaveBeenCalledTimes(1);
    });

    test('does not emit if no new relations added', () => {
      addRelation({ from: 'a', to: 'b', type: 'follow-up' });
      const listener = vi.fn();
      subscribeGraph(listener);
      addRelations([{ from: 'a', to: 'b', type: 'follow-up' }]);
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('subscribeGraph', () => {
    test('returns unsubscribe function', () => {
      const listener = vi.fn();
      const unsub = subscribeGraph(listener);
      unsub();
      addRelation({ from: 'a', to: 'b', type: 'echoes' });
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('clearGraph', () => {
    test('removes all relations and indexes', () => {
      addRelation({ from: 'a', to: 'b', type: 'follow-up' });
      clearGraph();
      expect(getAllRelations()).toHaveLength(0);
      expect(index.byFrom.size).toBe(0);
      expect(index.byTo.size).toBe(0);
      expect(index.byType.size).toBe(0);
    });
  });

  describe('loadFromPersistence', () => {
    test('loads entry-entry relations from persistence', async () => {
      vi.mocked(getByNotebook).mockResolvedValue([
        {
          id: 'r1', notebookId: 'nb1', from: 'a', fromKind: 'entry',
          to: 'b', toKind: 'entry', type: 'follow-up', weight: 1,
          createdAt: Date.now(),
        },
      ]);
      await loadFromPersistence('nb1');
      expect(getAllRelations()).toHaveLength(1);
    });

    test('skips non-entry relations', async () => {
      vi.mocked(getByNotebook).mockResolvedValue([
        {
          id: 'r1', notebookId: 'nb1', from: 'a', fromKind: 'concept',
          to: 'b', toKind: 'thinker', type: 'references', weight: 1,
          createdAt: Date.now(),
        },
      ]);
      await loadFromPersistence('nb1');
      expect(getAllRelations()).toHaveLength(0);
    });
  });
});
