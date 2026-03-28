/**
 * Tests for library repository.
 */
import { describe, test, expect, beforeEach, vi } from 'vitest';

vi.mock('../../engine', () => ({
  get: vi.fn(),
  getAll: vi.fn().mockResolvedValue([]),
  put: vi.fn().mockResolvedValue(undefined),
  getByIndex: vi.fn().mockResolvedValue([]),
  patch: vi.fn(),
}));
vi.mock('../../ids', () => ({
  createId: vi.fn().mockReturnValue('lib-id'),
}));

import {
  createLibraryEntry, getLibraryEntry, getLibraryByNotebook,
  getAllLibrary, updateLibraryEntry,
} from '../library';
import { put, get, getByIndex, getAll, patch } from '../../engine';

describe('library repository', () => {
  beforeEach(() => vi.clearAllMocks());

  test('createLibraryEntry puts and returns record', async () => {
    const result = await createLibraryEntry({
      studentId: 's1', notebookId: 'nb1', title: 'Harmonices Mundi',
      author: 'Kepler', isCurrent: true, annotationCount: 5,
      quote: 'The heavens sing...',
    });
    expect(result.id).toBe('lib-id');
    expect(result.title).toBe('Harmonices Mundi');
    expect(put).toHaveBeenCalledOnce();
  });

  test('getLibraryEntry delegates to get', async () => {
    await getLibraryEntry('lib-1');
    expect(get).toHaveBeenCalledWith('library', 'lib-1');
  });

  test('getLibraryByNotebook delegates to getByIndex', async () => {
    await getLibraryByNotebook('nb1');
    expect(getByIndex).toHaveBeenCalledWith('library', 'by-notebook', 'nb1');
  });

  test('getAllLibrary delegates to getAll', async () => {
    await getAllLibrary();
    expect(getAll).toHaveBeenCalledWith('library');
  });

  test('updateLibraryEntry calls patch', async () => {
    await updateLibraryEntry('lib-1', { isCurrent: false });
    expect(patch).toHaveBeenCalledWith('library', 'lib-1', expect.any(Function));
  });
});
