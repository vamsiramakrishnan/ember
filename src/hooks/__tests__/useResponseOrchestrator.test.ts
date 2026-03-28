/**
 * Tests for useResponseOrchestrator — compound DAG-based tutor responses.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useResponseOrchestrator } from '../useResponseOrchestrator';

const mockParseIntentDAG = vi.fn();
const mockExecuteDAG = vi.fn();
const mockCollectEntries = vi.fn();
const mockDispatchNode = vi.fn();

vi.mock('@/services/intent-dag', () => ({
  parseIntentDAG: (...args: unknown[]) => mockParseIntentDAG(...args),
}));

vi.mock('@/services/dag-executor', () => ({
  executeDAG: (...args: unknown[]) => mockExecuteDAG(...args),
  collectEntries: (...args: unknown[]) => mockCollectEntries(...args),
}));

vi.mock('@/services/dag-dispatcher', () => ({
  dispatchNode: (...args: unknown[]) => mockDispatchNode(...args),
}));

describe('useResponseOrchestrator', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('starts inactive with empty plans', () => {
    const { result } = renderHook(() => useResponseOrchestrator());
    expect(result.current.active).toBe(false);
    expect(result.current.plans).toEqual([]);
    expect(result.current.dag).toBeNull();
  });

  it('tryParse returns null for simple input', async () => {
    mockParseIntentDAG.mockResolvedValue({ isCompound: false, nodes: [] });
    const { result } = renderHook(() => useResponseOrchestrator());
    const dag = await result.current.tryParse('hello', []);
    expect(dag).toBeNull();
  });

  it('tryParse returns DAG for compound input', async () => {
    const mockDAG = { isCompound: true, nodes: [{ id: 'n1', label: 'Research', action: 'research' }] };
    mockParseIntentDAG.mockResolvedValue(mockDAG);
    const { result } = renderHook(() => useResponseOrchestrator());
    const dag = await result.current.tryParse('research and explain gravity', []);
    expect(dag).toBe(mockDAG);
  });

  it('execute runs DAG and produces entries', async () => {
    const dag = {
      isCompound: true,
      nodes: [{ id: 'n1', label: 'Explain', action: 'explain' }],
    };
    const mockResults = new Map();
    mockExecuteDAG.mockResolvedValue(mockResults);
    mockCollectEntries.mockReturnValue([{ type: 'tutor-marginalia', content: 'Explained' }]);

    const { result } = renderHook(() => useResponseOrchestrator());
    const onEntries = vi.fn();

    await act(async () => {
      await result.current.execute(dag as never, onEntries);
    });

    expect(onEntries).toHaveBeenCalledWith([{ type: 'tutor-marginalia', content: 'Explained' }]);
    expect(result.current.active).toBe(false);
  });
});
