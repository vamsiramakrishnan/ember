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
}));

describe('working-memory', () => {
  beforeEach(async () => {
    vi.resetModules();
    for (const key of Object.keys(mockStorage)) delete mockStorage[key];
  });

  test('getWorkingMemory returns null for unknown notebook', async () => {
    const { getWorkingMemory } = await import('../working-memory');
    expect(getWorkingMemory('unknown')).toBeNull();
  });

  test('getWorkingMemory restores from localStorage', async () => {
    mockStorage['ember:working-memory'] = JSON.stringify({
      nb1: { summary: 'saved summary', turnCount: 3, lastUpdated: 1000 },
    });

    const { getWorkingMemory } = await import('../working-memory');
    const mem = getWorkingMemory('nb1');
    expect(mem).not.toBeNull();
    expect(mem?.summary).toBe('saved summary');
    expect(mem?.turnCount).toBe(3);
  });

  test('resetWorkingMemory clears memory for notebook', async () => {
    mockStorage['ember:working-memory'] = JSON.stringify({
      nb1: { summary: 'old', turnCount: 1, lastUpdated: 0 },
    });

    const { getWorkingMemory, resetWorkingMemory } = await import('../working-memory');
    // Load from storage first
    getWorkingMemory('nb1');
    resetWorkingMemory('nb1');
    expect(getWorkingMemory('nb1')).toBeNull();
  });

  test('updateWorkingMemory skips when AI not available', async () => {
    const gemini = await import('../gemini');
    vi.mocked(gemini.isGeminiAvailable).mockReturnValue(false);

    const { updateWorkingMemory } = await import('../working-memory');
    await updateWorkingMemory('nb1', []);
    // Should not throw and should not call runTextAgent
    const runAgent = await import('../run-agent');
    expect(runAgent.runTextAgent).not.toHaveBeenCalled();
  });

  test('updateWorkingMemory increments turn count', async () => {
    const { updateWorkingMemory, getWorkingMemory } = await import('../working-memory');

    // First update: turnCount becomes 1 (not multiple of 3, and no existing summary)
    // So it should still call the agent since there's no existing summary
    await updateWorkingMemory('nb1', []);
    const mem = getWorkingMemory('nb1');
    expect(mem).not.toBeNull();
    expect(mem?.turnCount).toBe(1);
  });

  test('updateWorkingMemory only compresses every 3 turns when summary exists', async () => {
    // Seed with existing memory at turnCount 1
    mockStorage['ember:working-memory'] = JSON.stringify({
      nb1: { summary: 'existing', turnCount: 1, lastUpdated: 0 },
    });

    const runAgent = await import('../run-agent');
    const { updateWorkingMemory } = await import('../working-memory');

    // Turn 2: should skip compression (turnCount 2, not multiple of 3)
    await updateWorkingMemory('nb1', []);
    expect(runAgent.runTextAgent).not.toHaveBeenCalled();
  });

  test('WorkingMemory interface shape', () => {
    const mem: import('../working-memory').WorkingMemory = {
      summary: 'test summary',
      turnCount: 5,
      lastUpdated: Date.now(),
    };
    expect(mem.summary).toBe('test summary');
  });
});
