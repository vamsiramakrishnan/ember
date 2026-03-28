/**
 * Tests for seed — database seeding.
 */
import { describe, test, expect, vi, beforeEach } from 'vitest';

vi.mock('../engine', () => ({
  count: vi.fn().mockResolvedValue(0),
  putBatch: vi.fn().mockResolvedValue(undefined),
  openDB: vi.fn().mockResolvedValue({}),
  _resetForTest: vi.fn(),
  put: vi.fn(),
  get: vi.fn(),
  getAll: vi.fn().mockResolvedValue([]),
  getByIndex: vi.fn().mockResolvedValue([]),
}));
vi.mock('../repositories/students', () => ({
  createStudent: vi.fn().mockResolvedValue({ id: 's1', name: 'Arjun' }),
}));
vi.mock('../repositories/notebooks', () => ({
  createNotebook: vi.fn().mockResolvedValue({ id: 'nb1' }),
}));
vi.mock('../repositories/sessions', () => ({
  createSession: vi.fn().mockResolvedValue({ id: 'sess1' }),
}));
vi.mock('../repositories/entries', () => ({
  createEntries: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('../ids', () => ({
  createId: vi.fn().mockReturnValue('seed-id'),
}));

import { seedIfEmpty } from '../seed';
import { count } from '../engine';
import { createStudent } from '../repositories/students';

describe('seed', () => {
  beforeEach(() => vi.clearAllMocks());

  test('seedIfEmpty creates student when database is empty', async () => {
    vi.mocked(count).mockResolvedValue(0);
    await seedIfEmpty();
    expect(createStudent).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Arjun' }),
    );
  });

  test('seedIfEmpty skips when students exist', async () => {
    vi.mocked(count).mockResolvedValue(1);
    await seedIfEmpty();
    expect(createStudent).not.toHaveBeenCalled();
  });
});
