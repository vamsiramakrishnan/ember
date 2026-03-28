/**
 * Tests for sessions repository.
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
  createId: vi.fn().mockReturnValue('sess-id'),
}));

import {
  createSession, getSession, getSessionsByNotebook,
  getSessionsByStudent, getAllSessions, getLatestSession,
} from '../sessions';
import { put, get, getAll, getByIndex } from '../../engine';

describe('sessions repository', () => {
  beforeEach(() => vi.clearAllMocks());

  test('createSession returns record with generated id', async () => {
    const result = await createSession({
      studentId: 's1', notebookId: 'nb1', number: 1,
      date: '2024-01-01', timeOfDay: 'afternoon', topic: 'Test',
    });
    expect(result.id).toBe('sess-id');
    expect(result.studentId).toBe('s1');
    expect(put).toHaveBeenCalledOnce();
  });

  test('getSession delegates to get', async () => {
    vi.mocked(get).mockResolvedValue({ id: 'sess-1' });
    const result = await getSession('sess-1');
    expect(result).toBeDefined();
  });

  test('getSessionsByNotebook sorts by createdAt', async () => {
    vi.mocked(getByIndex).mockResolvedValue([
      { id: 's2', createdAt: 200 },
      { id: 's1', createdAt: 100 },
    ]);
    const result = await getSessionsByNotebook('nb1');
    expect(result[0]!.id).toBe('s1');
  });

  test('getSessionsByStudent sorts by createdAt', async () => {
    vi.mocked(getByIndex).mockResolvedValue([
      { id: 's2', createdAt: 200 },
      { id: 's1', createdAt: 100 },
    ]);
    const result = await getSessionsByStudent('s1');
    expect(result[0]!.id).toBe('s1');
  });

  test('getAllSessions sorts by createdAt', async () => {
    vi.mocked(getAll).mockResolvedValue([
      { id: 's2', createdAt: 200 },
      { id: 's1', createdAt: 100 },
    ]);
    const result = await getAllSessions();
    expect(result[0]!.id).toBe('s1');
  });

  test('getLatestSession returns last sorted session', async () => {
    vi.mocked(getAll).mockResolvedValue([
      { id: 's1', createdAt: 100 },
      { id: 's2', createdAt: 200 },
    ]);
    const result = await getLatestSession();
    expect(result!.id).toBe('s2');
  });

  test('getLatestSession returns undefined for empty', async () => {
    vi.mocked(getAll).mockResolvedValue([]);
    expect(await getLatestSession()).toBeUndefined();
  });
});
