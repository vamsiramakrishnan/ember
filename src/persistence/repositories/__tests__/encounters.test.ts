/**
 * Tests for encounters repository.
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
  createId: vi.fn().mockReturnValue('enc-id'),
}));

import {
  createEncounter, getEncountersByNotebook,
  getAllEncounters, getEncountersByThinker, getEncountersByStatus,
  updateEncounterStatus,
} from '../encounters';
import { put, getByIndex, getAll, patch } from '../../engine';

describe('encounters repository', () => {
  beforeEach(() => vi.clearAllMocks());

  test('createEncounter puts and returns record', async () => {
    const result = await createEncounter({
      studentId: 's1', notebookId: 'nb1', ref: 'kepler-001',
      thinker: 'Kepler', tradition: 'Astronomy',
      coreIdea: 'Harmony of spheres', sessionTopic: 'Music',
      date: '2024-01-01', status: 'active',
    });
    expect(result.id).toBe('enc-id');
    expect(result.thinker).toBe('Kepler');
    expect(put).toHaveBeenCalledOnce();
  });

  test('getEncountersByNotebook sorts by createdAt descending', async () => {
    vi.mocked(getByIndex).mockResolvedValue([
      { id: 'e1', createdAt: 100 },
      { id: 'e2', createdAt: 300 },
    ]);
    const result = await getEncountersByNotebook('nb1');
    expect(result[0]!.id).toBe('e2');
  });

  test('getAllEncounters sorts by createdAt descending', async () => {
    vi.mocked(getAll).mockResolvedValue([
      { id: 'e1', createdAt: 100 },
      { id: 'e2', createdAt: 200 },
    ]);
    const result = await getAllEncounters();
    expect(result[0]!.id).toBe('e2');
  });

  test('getEncountersByThinker delegates to getByIndex', async () => {
    await getEncountersByThinker('Kepler');
    expect(getByIndex).toHaveBeenCalledWith('encounters', 'by-thinker', 'Kepler');
  });

  test('getEncountersByStatus delegates to getByIndex', async () => {
    await getEncountersByStatus('dormant');
    expect(getByIndex).toHaveBeenCalledWith('encounters', 'by-status', 'dormant');
  });

  test('updateEncounterStatus calls patch', async () => {
    await updateEncounterStatus('enc-1', 'bridged', 'other-nb');
    expect(patch).toHaveBeenCalledWith('encounters', 'enc-1', expect.any(Function));
  });
});
