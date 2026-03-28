/**
 * Tests for persisted-notebook-helpers — reconciliation functions.
 */
import { describe, it, expect, vi } from 'vitest';
import {
  reconcileContentPatches,
  reconcileMetaPatches,
  type OptimisticPatch,
} from '../persisted-notebook-helpers';
import type { NotebookEntry, LiveEntry } from '@/types/entries';

vi.mock('@/persistence/repositories/blobs', () => ({
  getBlobAsDataUrl: vi.fn().mockResolvedValue(null),
}));

function makeLiveEntry(id: string, content: string, meta?: Partial<LiveEntry>): LiveEntry {
  return {
    id,
    entry: { type: 'prose', content } as NotebookEntry,
    crossedOut: false,
    bookmarked: false,
    pinned: false,
    timestamp: Date.now(),
    ...meta,
  };
}

describe('reconcileContentPatches', () => {
  it('removes patches that match DB content', () => {
    const patches = new Map<string, NotebookEntry>();
    patches.set('e1', { type: 'prose', content: 'updated text' });

    const dbEntries = [makeLiveEntry('e1', 'updated text')];
    const result = reconcileContentPatches(patches, dbEntries);
    expect(result.size).toBe(0);
  });

  it('keeps patches that differ from DB content', () => {
    const patches = new Map<string, NotebookEntry>();
    patches.set('e1', { type: 'prose', content: 'local change' });

    const dbEntries = [makeLiveEntry('e1', 'old content')];
    const result = reconcileContentPatches(patches, dbEntries);
    expect(result.size).toBe(1);
    expect(result.get('e1')).toMatchObject({ content: 'local change' });
  });

  it('keeps patches for entries not in DB', () => {
    const patches = new Map<string, NotebookEntry>();
    patches.set('missing', { type: 'prose', content: 'orphan' });

    const result = reconcileContentPatches(patches, []);
    expect(result.size).toBe(1);
  });

  it('returns same reference if nothing changed', () => {
    const patches = new Map<string, NotebookEntry>();
    patches.set('e1', { type: 'prose', content: 'different' });

    const dbEntries = [makeLiveEntry('e1', 'original')];
    const result = reconcileContentPatches(patches, dbEntries);
    expect(result).toBe(patches);
  });

  it('handles empty patches map', () => {
    const patches = new Map<string, NotebookEntry>();
    const result = reconcileContentPatches(patches, [makeLiveEntry('e1', 'text')]);
    expect(result.size).toBe(0);
  });
});

describe('reconcileMetaPatches', () => {
  it('removes patches where DB has caught up', () => {
    const patches = new Map<string, OptimisticPatch>();
    patches.set('e1', { crossedOut: true });

    const dbEntries = [makeLiveEntry('e1', 'text', { crossedOut: true })];
    const result = reconcileMetaPatches(patches, dbEntries);
    expect(result.size).toBe(0);
  });

  it('keeps patches where DB has not caught up', () => {
    const patches = new Map<string, OptimisticPatch>();
    patches.set('e1', { bookmarked: true });

    const dbEntries = [makeLiveEntry('e1', 'text', { bookmarked: false })];
    const result = reconcileMetaPatches(patches, dbEntries);
    expect(result.size).toBe(1);
  });

  it('keeps patches for entries not in DB', () => {
    const patches = new Map<string, OptimisticPatch>();
    patches.set('missing', { pinned: true });

    const result = reconcileMetaPatches(patches, []);
    expect(result.size).toBe(1);
  });

  it('handles pinned mismatch', () => {
    const patches = new Map<string, OptimisticPatch>();
    patches.set('e1', { pinned: true });

    const dbEntries = [makeLiveEntry('e1', 'text', { pinned: false })];
    const result = reconcileMetaPatches(patches, dbEntries);
    expect(result.size).toBe(1);
  });
});
