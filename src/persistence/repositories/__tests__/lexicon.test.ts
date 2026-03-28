/**
 * Tests for lexicon repository.
 */
import { describe, test, expect, beforeEach, vi } from 'vitest';

vi.mock('../../engine', () => ({
  get: vi.fn(),
  getAll: vi.fn().mockResolvedValue([]),
  put: vi.fn().mockResolvedValue(undefined),
  getByIndex: vi.fn().mockResolvedValue([]),
  del: vi.fn().mockResolvedValue(undefined),
  patch: vi.fn(),
}));
vi.mock('../../ids', () => ({
  createId: vi.fn().mockReturnValue('lex-id'),
}));

import {
  createLexiconEntry, getLexiconEntry, getLexiconByNotebook,
  getAllLexicon, getLexiconByLevel, deleteLexiconEntry,
} from '../lexicon';
import { put, get, getByIndex, getAll, del } from '../../engine';

describe('lexicon repository', () => {
  beforeEach(() => vi.clearAllMocks());

  test('createLexiconEntry puts and returns record', async () => {
    const result = await createLexiconEntry({
      studentId: 's1', notebookId: 'nb1', number: 1,
      term: 'Ratio', pronunciation: '/ˈreɪ.ʃi.oʊ/',
      definition: 'A quantitative relation', level: 'exploring',
      percentage: 15, etymology: 'Latin', crossReferences: [],
    });
    expect(result.id).toBe('lex-id');
    expect(result.term).toBe('Ratio');
    expect(put).toHaveBeenCalledOnce();
  });

  test('getLexiconEntry delegates to get', async () => {
    await getLexiconEntry('lex-1');
    expect(get).toHaveBeenCalledWith('lexicon', 'lex-1');
  });

  test('getLexiconByNotebook sorts by number', async () => {
    vi.mocked(getByIndex).mockResolvedValue([
      { id: 'l2', number: 2 },
      { id: 'l1', number: 1 },
    ]);
    const result = await getLexiconByNotebook('nb1');
    expect(result[0]!.id).toBe('l1');
  });

  test('getAllLexicon sorts by number', async () => {
    vi.mocked(getAll).mockResolvedValue([
      { id: 'l2', number: 3 },
      { id: 'l1', number: 1 },
    ]);
    const result = await getAllLexicon();
    expect(result[0]!.id).toBe('l1');
  });

  test('getLexiconByLevel delegates to getByIndex', async () => {
    await getLexiconByLevel('strong');
    expect(getByIndex).toHaveBeenCalledWith('lexicon', 'by-level', 'strong');
  });

  test('deleteLexiconEntry delegates to del', async () => {
    await deleteLexiconEntry('lex-1');
    expect(del).toHaveBeenCalledWith('lexicon', 'lex-1');
  });
});
