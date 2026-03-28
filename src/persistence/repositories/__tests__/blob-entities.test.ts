/**
 * Tests for blob-entities — bridge between blobs and knowledge graph.
 */
import { describe, test, expect, beforeEach, vi } from 'vitest';

vi.mock('../blobs', () => ({
  getBlobsByRef: vi.fn().mockResolvedValue([]),
  getBlobAsDataUrl: vi.fn().mockResolvedValue('data:image/png;base64,abc'),
}));
vi.mock('../../engine', () => ({
  getByIndex: vi.fn().mockResolvedValue([]),
  put: vi.fn(),
  getAll: vi.fn(),
  del: vi.fn(),
  get: vi.fn(),
}));
vi.mock('../graph', () => ({
  createRelation: vi.fn().mockImplementation((params) =>
    Promise.resolve({ id: 'rel-1', createdAt: Date.now(), ...params }),
  ),
}));
vi.mock('../../emitter', () => ({
  notify: vi.fn(),
}));
vi.mock('../../sync/oplog', () => ({
  recordOp: vi.fn(),
}));
vi.mock('../../ids', () => ({
  createId: vi.fn().mockReturnValue('id'),
}));

import { linkBlobToGraph, getBlobForAgent } from '../blob-entities';
import { createRelation } from '../graph';
import { getBlobAsDataUrl } from '../blobs';

describe('blob-entities', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('linkBlobToGraph', () => {
    test('creates relations for each target', async () => {
      const relations = await linkBlobToGraph('entry-1', 'nb1', [
        { entityId: 'concept-1', entityKind: 'concept', relationType: 'references' },
        { entityId: 'thinker-1', entityKind: 'thinker', relationType: 'references' },
      ]);
      expect(relations).toHaveLength(2);
      expect(createRelation).toHaveBeenCalledTimes(2);
    });

    test('passes correct parameters to createRelation', async () => {
      await linkBlobToGraph('entry-1', 'nb1', [
        { entityId: 'concept-1', entityKind: 'concept', relationType: 'references' },
      ]);
      expect(createRelation).toHaveBeenCalledWith(
        expect.objectContaining({
          notebookId: 'nb1',
          from: 'entry-1',
          fromKind: 'entry',
          to: 'concept-1',
          toKind: 'concept',
          weight: 0.9,
        }),
      );
    });
  });

  describe('getBlobForAgent', () => {
    test('returns image data URL for image mime types', async () => {
      const result = await getBlobForAgent('hash1', 'image/png');
      expect(result.type).toBe('image');
      expect(result.content).toContain('data:image');
    });

    test('returns unavailable message when blob not found', async () => {
      vi.mocked(getBlobAsDataUrl).mockResolvedValue(undefined);
      const result = await getBlobForAgent('hash1', 'image/png');
      expect(result.content).toBe('(image unavailable)');
    });

    test('returns metadata for non-image types', async () => {
      const result = await getBlobForAgent('hash1', 'application/pdf');
      expect(result.type).toBe('metadata');
    });
  });
});
