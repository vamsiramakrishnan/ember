/**
 * Tests for mastery repository — concept mastery and curiosities.
 */
import { describe, test, expect, beforeEach, vi } from 'vitest';

vi.mock('../../engine', () => ({
  getAll: vi.fn().mockResolvedValue([]),
  put: vi.fn().mockResolvedValue(undefined),
  getByIndex: vi.fn().mockResolvedValue([]),
  putBatch: vi.fn().mockResolvedValue(undefined),
  upsertByIndex: vi.fn().mockImplementation(
    (_s: string, _i: string, _k: unknown, _u: unknown, creator: () => unknown) => Promise.resolve(creator()),
  ),
}));
vi.mock('../../ids', () => ({
  createId: vi.fn().mockReturnValue('mastery-id'),
}));

import {
  upsertMastery, getMasteryByNotebook, getAllMastery,
  getMasteryByLevel, createCuriosity, getCuriositiesByNotebook,
  seedMastery,
} from '../mastery';
import { upsertByIndex, getByIndex, getAll, put, putBatch } from '../../engine';

describe('mastery repository', () => {
  beforeEach(() => vi.clearAllMocks());

  test('upsertMastery calls upsertByIndex', async () => {
    await upsertMastery({
      studentId: 's1', notebookId: 'nb1',
      concept: 'Ratio', level: 'exploring', percentage: 15,
    });
    expect(upsertByIndex).toHaveBeenCalledWith(
      'mastery', 'by-concept', ['nb1', 'Ratio'],
      expect.any(Function), expect.any(Function),
    );
  });

  test('getMasteryByNotebook delegates to getByIndex', async () => {
    await getMasteryByNotebook('nb1');
    expect(getByIndex).toHaveBeenCalledWith('mastery', 'by-notebook', 'nb1');
  });

  test('getAllMastery delegates to getAll', async () => {
    await getAllMastery();
    expect(getAll).toHaveBeenCalledWith('mastery');
  });

  test('getMasteryByLevel delegates to getByIndex', async () => {
    await getMasteryByLevel('strong');
    expect(getByIndex).toHaveBeenCalledWith('mastery', 'by-level', 'strong');
  });

  test('createCuriosity puts record and returns it', async () => {
    const result = await createCuriosity({
      studentId: 's1', notebookId: 'nb1', question: 'Why?',
    });
    expect(result.question).toBe('Why?');
    expect(put).toHaveBeenCalledOnce();
  });

  test('getCuriositiesByNotebook delegates to getByIndex', async () => {
    await getCuriositiesByNotebook('nb1');
    expect(getByIndex).toHaveBeenCalledWith('curiosities', 'by-notebook', 'nb1');
  });

  test('seedMastery calls putBatch', async () => {
    await seedMastery('s1', 'nb1', [
      { concept: 'A', level: 'exploring', percentage: 10 },
      { concept: 'B', level: 'developing', percentage: 30 },
    ]);
    expect(putBatch).toHaveBeenCalledOnce();
  });
});
