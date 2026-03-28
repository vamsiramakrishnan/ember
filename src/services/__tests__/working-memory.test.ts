/**
 * Tests for working-memory — compressed session summary management.
 */
import { describe, test, expect, vi, beforeEach } from 'vitest';

const mockStorage: Record<string, string> = {};
vi.stubGlobal('localStorage', {
  getItem: vi.fn((key: string) => mockStorage[key] ?? null),
  setItem: vi.fn((key: string, value: string) => { mockStorage[key] = value; }),
  removeItem: vi.fn((key: string) => { delete mockStorage[key]; }),
});

vi.mock('../run-agent', () => ({
  runTextAgent: vi.fn(async () => ({ text: 'compressed summary', citations: [] })),
}));

vi.mock('../gemini', () => ({
  isGeminiAvailable: vi.fn(() => true),
  MODELS: { text: 'test', heavy: 'test', image: 'test', fallback: 'test', gemma: 'test' },
  getGeminiClient: vi.fn(() => null),
}));

import {
  getWorkingMemory,
  updateWorkingMemory,
  resetWorkingMemory,
} from '../working-memory';
import { isGeminiAvailable } from '../gemini';
import { runTextAgent } from '../run-agent';
import type { WorkingMemory } from '../working-memory';

describe('working-memory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    for (const key of Object.keys(mockStorage)) delete mockStorage[key];
    vi.mocked(isGeminiAvailable).mockReturnValue(true);
    // Reset the internal module cache by resetting memory for all notebooks
    resetWorkingMemory('nb1');
    resetWorkingMemory('unknown');
  });

  test('getWorkingMemory returns null for unknown notebook', () => {
    expect(getWorkingMemory('unknown')).toBeNull();
  });

  test('getWorkingMemory restores from localStorage', () => {
    mockStorage['ember:working-memory'] = JSON.stringify({
      nb1: { summary: 'saved summary', turnCount: 3, lastUpdated: 1000 },
    });

    const mem = getWorkingMemory('nb1');
    expect(mem).not.toBeNull();
    expect(mem?.summary).toBe('saved summary');
    expect(mem?.turnCount).toBe(3);
  });

  test('resetWorkingMemory clears memory for notebook', () => {
    mockStorage['ember:working-memory'] = JSON.stringify({
      nb1: { summary: 'old', turnCount: 1, lastUpdated: 0 },
    });

    // Load from storage first
    getWorkingMemory('nb1');
    resetWorkingMemory('nb1');
    expect(getWorkingMemory('nb1')).toBeNull();
  });

  test('updateWorkingMemory skips when AI not available', async () => {
    vi.mocked(isGeminiAvailable).mockReturnValue(false);

    await updateWorkingMemory('nb1', []);
    expect(runTextAgent).not.toHaveBeenCalled();
  });

  test('updateWorkingMemory increments turn count', async () => {
    await updateWorkingMemory('nb1', []);
    const mem = getWorkingMemory('nb1');
    expect(mem).not.toBeNull();
    expect(mem?.turnCount).toBe(1);
  });

  test('updateWorkingMemory only compresses every 3 turns when summary exists', async () => {
    // First, create memory with turnCount 1 via the API
    // (calling updateWorkingMemory creates turn 1 with a summary)
    await updateWorkingMemory('nb1', []);
    vi.clearAllMocks();
    vi.mocked(isGeminiAvailable).mockReturnValue(true);

    // Now turn 2: should skip compression (turnCount 2, not multiple of 3)
    await updateWorkingMemory('nb1', []);
    expect(runTextAgent).not.toHaveBeenCalled();
  });

  test('WorkingMemory interface shape', () => {
    const mem: WorkingMemory = {
      summary: 'test summary',
      turnCount: 5,
      lastUpdated: Date.now(),
    };
    expect(mem.summary).toBe('test summary');
  });
});
