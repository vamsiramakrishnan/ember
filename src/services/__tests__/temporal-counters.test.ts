/**
 * Tests for temporal-counters — per-notebook persisted counters.
 */
import { describe, test, expect, vi, beforeEach } from 'vitest';

// Mock localStorage
const mockStorage: Record<string, string> = {};
vi.stubGlobal('localStorage', {
  getItem: vi.fn((key: string) => mockStorage[key] ?? null),
  setItem: vi.fn((key: string, value: string) => { mockStorage[key] = value; }),
  removeItem: vi.fn((key: string) => { delete mockStorage[key]; }),
});

describe('temporal-counters', () => {
  beforeEach(async () => {
    vi.resetModules();
    for (const key of Object.keys(mockStorage)) delete mockStorage[key];
  });

  test('incrementEcho increments and returns counter', async () => {
    const { incrementEcho } = await import('../temporal-counters');
    expect(incrementEcho('nb1')).toBe(1);
    expect(incrementEcho('nb1')).toBe(2);
    expect(incrementEcho('nb1')).toBe(3);
  });

  test('getEchoCount returns current value without incrementing', async () => {
    const { incrementEcho, getEchoCount } = await import('../temporal-counters');
    incrementEcho('nb1');
    incrementEcho('nb1');
    expect(getEchoCount('nb1')).toBe(2);
    expect(getEchoCount('nb1')).toBe(2); // unchanged
  });

  test('counters are per-notebook', async () => {
    const { incrementEcho, getEchoCount } = await import('../temporal-counters');
    incrementEcho('nb1');
    incrementEcho('nb1');
    incrementEcho('nb2');
    expect(getEchoCount('nb1')).toBe(2);
    expect(getEchoCount('nb2')).toBe(1);
  });

  test('isBridgeGenerated returns false initially', async () => {
    const { isBridgeGenerated } = await import('../temporal-counters');
    expect(isBridgeGenerated('nb1')).toBe(false);
  });

  test('markBridgeGenerated sets flag to true', async () => {
    const { markBridgeGenerated, isBridgeGenerated } = await import('../temporal-counters');
    markBridgeGenerated('nb1');
    expect(isBridgeGenerated('nb1')).toBe(true);
  });

  test('resetBridgeFlag resets to false', async () => {
    const { markBridgeGenerated, resetBridgeFlag, isBridgeGenerated } = await import('../temporal-counters');
    markBridgeGenerated('nb1');
    resetBridgeFlag('nb1');
    expect(isBridgeGenerated('nb1')).toBe(false);
  });

  test('incrementReflection works independently from echo', async () => {
    const { incrementReflection, getReflectionCount, incrementEcho } = await import('../temporal-counters');
    incrementEcho('nb1');
    incrementEcho('nb1');
    incrementReflection('nb1');
    expect(getReflectionCount('nb1')).toBe(1);
  });

  test('resetReflection resets to 0', async () => {
    const { incrementReflection, resetReflection, getReflectionCount } = await import('../temporal-counters');
    incrementReflection('nb1');
    incrementReflection('nb1');
    resetReflection('nb1');
    expect(getReflectionCount('nb1')).toBe(0);
  });

  test('counters persist to localStorage', async () => {
    const { incrementEcho } = await import('../temporal-counters');
    incrementEcho('nb1');
    expect(localStorage.setItem).toHaveBeenCalled();
  });

  test('counters restore from localStorage', async () => {
    mockStorage['ember:temporal-counters'] = JSON.stringify({
      nb1: { echo: 5, reflection: 2, bridgeGenerated: true },
    });

    const { getEchoCount, getReflectionCount, isBridgeGenerated } = await import('../temporal-counters');
    expect(getEchoCount('nb1')).toBe(5);
    expect(getReflectionCount('nb1')).toBe(2);
    expect(isBridgeGenerated('nb1')).toBe(true);
  });
});
