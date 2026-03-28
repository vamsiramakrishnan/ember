/**
 * Tests for graph repository — knowledge graph CRUD and traversal.
 */
import { describe, test, expect, beforeEach, vi } from 'vitest';

vi.mock('../../engine', () => ({
  put: vi.fn().mockResolvedValue(undefined),
  getAll: vi.fn().mockResolvedValue([]),
  getByIndex: vi.fn().mockResolvedValue([]),
  del: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('../../emitter', () => ({
  notify: vi.fn(),
}));
vi.mock('../../sync/oplog', () => ({
  recordOp: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('../../ids', () => ({
  createId: vi.fn().mockReturnValue('rel-id'),
}));

import {
  createRelation, createRelations, deleteRelation,
  getOutgoing, getIncoming, getByNotebook, getAllRelations,
  followChain, findPath, getNeighborhood,
} from '../graph';
import { put, getByIndex, del } from '../../engine';
import { notify } from '../../emitter';

describe('graph repository', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('createRelation', () => {
    test('creates and returns relation', async () => {
      vi.mocked(getByIndex).mockResolvedValue([]);
      const result = await createRelation({
        notebookId: 'nb1', from: 'a', fromKind: 'entry',
        to: 'b', toKind: 'entry', type: 'follow-up', weight: 1,
      });
      expect(result.id).toBe('rel-id');
      expect(put).toHaveBeenCalledOnce();
      expect(notify).toHaveBeenCalled();
    });

    test('deduplicates by from+to+type', async () => {
      vi.mocked(getByIndex).mockResolvedValue([
        { id: 'existing', type: 'follow-up' },
      ]);
      const result = await createRelation({
        notebookId: 'nb1', from: 'a', fromKind: 'entry',
        to: 'b', toKind: 'entry', type: 'follow-up', weight: 1,
      });
      expect(result.id).toBe('existing');
      expect(put).not.toHaveBeenCalled();
    });
  });

  describe('createRelations', () => {
    test('returns empty for empty input', async () => {
      const result = await createRelations([]);
      expect(result).toEqual([]);
    });

    test('deduplicates within batch', async () => {
      vi.mocked(getByIndex).mockResolvedValue([]);
      const params = {
        notebookId: 'nb1', from: 'a', fromKind: 'entry' as const,
        to: 'b', toKind: 'entry' as const, type: 'follow-up' as const, weight: 1,
      };
      const result = await createRelations([params, params]);
      expect(result).toHaveLength(1);
    });
  });

  describe('deleteRelation', () => {
    test('deletes and notifies', async () => {
      await deleteRelation('rel-1');
      expect(del).toHaveBeenCalledWith('relations', 'rel-1');
      expect(notify).toHaveBeenCalled();
    });
  });

  describe('followChain', () => {
    test('follows a chain of relations', async () => {
      vi.mocked(getByIndex)
        .mockResolvedValueOnce([{ to: 'b', type: 'follow-up' }])
        .mockResolvedValueOnce([{ to: 'c', type: 'follow-up' }])
        .mockResolvedValueOnce([]);
      const chain = await followChain('a', 'follow-up');
      expect(chain).toEqual(['a', 'b', 'c']);
    });

    test('stops at max depth', async () => {
      vi.mocked(getByIndex).mockResolvedValue([{ to: 'next', type: 'follow-up' }]);
      const chain = await followChain('start', 'follow-up', 2);
      expect(chain.length).toBeLessThanOrEqual(3);
    });
  });

  describe('findPath', () => {
    test('returns empty for unreachable target', async () => {
      vi.mocked(getByIndex).mockResolvedValue([]);
      const path = await findPath('a', 'z', 2);
      expect(path).toEqual([]);
    });
  });

  describe('getNeighborhood', () => {
    test('returns outgoing and incoming neighbors', async () => {
      vi.mocked(getByIndex)
        .mockResolvedValueOnce([{ to: 'b', toKind: 'concept', type: 'explores' }])
        .mockResolvedValueOnce([{ from: 'c', fromKind: 'thinker', type: 'introduces' }]);
      const hood = await getNeighborhood('a');
      expect(hood).toHaveLength(2);
      expect(hood[0]!.direction).toBe('out');
      expect(hood[1]!.direction).toBe('in');
    });
  });
});
