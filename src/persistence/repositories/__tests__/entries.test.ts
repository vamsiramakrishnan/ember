/**
 * Tests for entries repository — CRUD for notebook entries.
 */
import { describe, test, expect, beforeEach, vi } from 'vitest';

vi.mock('../../engine', () => ({
  get: vi.fn(),
  getAll: vi.fn().mockResolvedValue([]),
  put: vi.fn().mockResolvedValue(undefined),
  getByIndex: vi.fn().mockResolvedValue([]),
  patch: vi.fn(),
}));
vi.mock('../../transaction', () => ({
  transact: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('../../ids', () => ({
  createId: vi.fn().mockReturnValue('test-id'),
  nextOrder: vi.fn().mockReturnValue(1),
}));
vi.mock('../blobs', () => ({
  storeDataUrl: vi.fn().mockResolvedValue('hash-abc'),
}));

import {
  createEntry, createEntries, getEntriesBySession,
  getEntry, updateEntry, updateEntryContent, getPinnedEntries,
} from '../entries';
import { put, get, getAll, getByIndex, patch } from '../../engine';
import { transact } from '../../transaction';
import { storeDataUrl } from '../blobs';

describe('entries repository', () => {
  beforeEach(() => vi.clearAllMocks());

  test('createEntry puts a record and returns it', async () => {
    vi.mocked(getByIndex).mockResolvedValue([]);
    const result = await createEntry('sess-1', { type: 'prose', content: 'Hello' });
    expect(put).toHaveBeenCalledOnce();
    expect(result.sessionId).toBe('sess-1');
    expect(result.type).toBe('prose');
    expect(result.crossedOut).toBe(false);
  });

  test('createEntry extracts blob from sketch entries', async () => {
    vi.mocked(getByIndex).mockResolvedValue([]);
    await createEntry('sess-1', { type: 'sketch', dataUrl: 'data:image/png;base64,abc' });
    expect(storeDataUrl).toHaveBeenCalledWith('data:image/png;base64,abc');
  });

  test('createEntry respects opts', async () => {
    vi.mocked(getByIndex).mockResolvedValue([]);
    const result = await createEntry('sess-1', { type: 'prose', content: 'test' }, {
      bookmarked: true, pinned: true,
    });
    expect(result.bookmarked).toBe(true);
    expect(result.pinned).toBe(true);
  });

  test('createEntries calls transact', async () => {
    await createEntries('sess-1', [
      { type: 'prose', content: 'A' },
      { type: 'prose', content: 'B' },
    ]);
    expect(transact).toHaveBeenCalledOnce();
  });

  test('getEntriesBySession sorts by order', async () => {
    vi.mocked(getByIndex).mockResolvedValue([
      { id: 'e2', order: 2, sessionId: 'sess-1' },
      { id: 'e1', order: 1, sessionId: 'sess-1' },
    ]);
    const result = await getEntriesBySession('sess-1');
    expect(result[0]!.id).toBe('e1');
    expect(result[1]!.id).toBe('e2');
  });

  test('getEntry calls get', async () => {
    vi.mocked(get).mockResolvedValue({ id: 'e1' });
    const result = await getEntry('e1');
    expect(result).toBeDefined();
  });

  test('updateEntry calls patch', async () => {
    await updateEntry('e1', { bookmarked: true });
    expect(patch).toHaveBeenCalledWith('entries', 'e1', expect.any(Function));
  });

  test('updateEntryContent calls patch with new entry', async () => {
    await updateEntryContent('e1', { type: 'prose', content: 'updated' });
    expect(patch).toHaveBeenCalledWith('entries', 'e1', expect.any(Function));
  });

  test('getPinnedEntries filters all entries', async () => {
    vi.mocked(getAll).mockResolvedValue([
      { id: 'e1', pinned: true },
      { id: 'e2', pinned: false },
      { id: 'e3', pinned: true },
    ]);
    const result = await getPinnedEntries();
    expect(result).toHaveLength(2);
  });
});
