/**
 * Tests for students repository.
 */
import { describe, test, expect, beforeEach, vi } from 'vitest';

vi.mock('../../engine', () => ({
  get: vi.fn(),
  getAll: vi.fn().mockResolvedValue([]),
  put: vi.fn().mockResolvedValue(undefined),
  patch: vi.fn(),
}));
vi.mock('../../ids', () => ({
  createId: vi.fn().mockReturnValue('student-id'),
}));

import { createStudent, getStudent, getAllStudents, updateStudent } from '../students';
import { put, get, getAll, patch } from '../../engine';

describe('students repository', () => {
  beforeEach(() => vi.clearAllMocks());

  test('createStudent returns record with defaults', async () => {
    const result = await createStudent({ name: 'Arjun' });
    expect(result.id).toBe('student-id');
    expect(result.name).toBe('Arjun');
    expect(result.displayName).toBe('Arjun');
    expect(result.totalMinutes).toBe(0);
    expect(put).toHaveBeenCalledOnce();
  });

  test('createStudent with displayName', async () => {
    const result = await createStudent({ name: 'Arjun', displayName: 'A.' });
    expect(result.displayName).toBe('A.');
  });

  test('getStudent delegates to engine.get', async () => {
    vi.mocked(get).mockResolvedValue({ id: 's1', name: 'Test' });
    const result = await getStudent('s1');
    expect(result).toBeDefined();
  });

  test('getAllStudents sorts by createdAt', async () => {
    vi.mocked(getAll).mockResolvedValue([
      { id: 's2', createdAt: 200 },
      { id: 's1', createdAt: 100 },
    ]);
    const result = await getAllStudents();
    expect(result[0]!.id).toBe('s1');
  });

  test('updateStudent calls patch', async () => {
    await updateStudent('s1', { totalMinutes: 120 });
    expect(patch).toHaveBeenCalledWith('students', 's1', expect.any(Function));
  });
});
