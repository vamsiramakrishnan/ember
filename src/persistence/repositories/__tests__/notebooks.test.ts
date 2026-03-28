/**
 * Tests for notebooks repository.
 */
import { describe, test, expect, beforeEach, vi } from 'vitest';

vi.mock('../../engine', () => ({
  get: vi.fn(),
  put: vi.fn().mockResolvedValue(undefined),
  getByIndex: vi.fn().mockResolvedValue([]),
  patch: vi.fn(),
}));
vi.mock('../../ids', () => ({
  createId: vi.fn().mockReturnValue('nb-id'),
}));

import { createNotebook, getNotebook, getNotebooksByStudent, updateNotebook } from '../notebooks';
import { put, get, getByIndex, patch } from '../../engine';

describe('notebooks repository', () => {
  beforeEach(() => vi.clearAllMocks());

  test('createNotebook returns record with defaults', async () => {
    const result = await createNotebook({ studentId: 's1', title: 'Music & Math' });
    expect(result.id).toBe('nb-id');
    expect(result.title).toBe('Music & Math');
    expect(result.description).toBe('');
    expect(result.sessionCount).toBe(0);
    expect(result.isActive).toBe(true);
    expect(put).toHaveBeenCalledOnce();
  });

  test('createNotebook with description', async () => {
    const result = await createNotebook({
      studentId: 's1', title: 'Test', description: 'A test notebook',
    });
    expect(result.description).toBe('A test notebook');
  });

  test('getNotebook delegates to get', async () => {
    vi.mocked(get).mockResolvedValue({ id: 'nb-1' });
    const result = await getNotebook('nb-1');
    expect(result).toBeDefined();
  });

  test('getNotebooksByStudent sorts by updatedAt descending', async () => {
    vi.mocked(getByIndex).mockResolvedValue([
      { id: 'nb1', updatedAt: 100 },
      { id: 'nb2', updatedAt: 300 },
      { id: 'nb3', updatedAt: 200 },
    ]);
    const result = await getNotebooksByStudent('s1');
    expect(result[0]!.id).toBe('nb2');
    expect(result[2]!.id).toBe('nb1');
  });

  test('updateNotebook calls patch', async () => {
    await updateNotebook('nb-1', { title: 'New Title' });
    expect(patch).toHaveBeenCalledWith('notebooks', 'nb-1', expect.any(Function));
  });
});
