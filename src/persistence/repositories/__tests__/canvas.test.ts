/**
 * Tests for canvas repository — spatial layout state per session.
 */
import { describe, test, expect, beforeEach, vi } from 'vitest';

vi.mock('../../engine', () => ({
  get: vi.fn(),
  getByIndex: vi.fn().mockResolvedValue([]),
  upsertByIndex: vi.fn().mockImplementation(
    (_s: string, _i: string, _k: unknown, _u: unknown, creator: () => unknown) => Promise.resolve(creator()),
  ),
}));
vi.mock('../../ids', () => ({
  createId: vi.fn().mockReturnValue('canvas-id'),
}));

import { saveCanvasState, getCanvasBySession, getCanvasState } from '../canvas';
import { get, getByIndex, upsertByIndex } from '../../engine';

describe('canvas repository', () => {
  beforeEach(() => vi.clearAllMocks());

  test('saveCanvasState upserts by session', async () => {
    const result = await saveCanvasState({
      sessionId: 'sess-1',
      positions: [{ id: 'node-1', x: 100, y: 200 }],
      connections: [{ from: 'a', to: 'b' }],
    });
    expect(result.sessionId).toBe('sess-1');
    expect(upsertByIndex).toHaveBeenCalledWith(
      'canvas', 'by-session', 'sess-1',
      expect.any(Function), expect.any(Function),
    );
  });

  test('getCanvasBySession returns first result', async () => {
    vi.mocked(getByIndex).mockResolvedValue([
      { id: 'c1', sessionId: 'sess-1', positions: [], connections: [] },
    ]);
    const result = await getCanvasBySession('sess-1');
    expect(result).toBeDefined();
    expect(result!.id).toBe('c1');
  });

  test('getCanvasBySession returns undefined for no results', async () => {
    vi.mocked(getByIndex).mockResolvedValue([]);
    const result = await getCanvasBySession('sess-missing');
    expect(result).toBeUndefined();
  });

  test('getCanvasState delegates to get', async () => {
    vi.mocked(get).mockResolvedValue({ id: 'c1' });
    const result = await getCanvasState('c1');
    expect(result).toBeDefined();
  });
});
