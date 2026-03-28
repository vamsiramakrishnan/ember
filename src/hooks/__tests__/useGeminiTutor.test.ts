/**
 * Tests for useGeminiTutor — AI-powered tutor response orchestration.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGeminiTutor } from '../useGeminiTutor';

vi.mock('@/services/gemini', () => ({
  isGeminiAvailable: vi.fn().mockReturnValue(false),
  getGeminiClient: vi.fn().mockReturnValue(null),
  MODELS: {
    text: 'gemini-test', heavy: 'gemini-test', image: 'gemini-test',
    fallback: 'gemini-test', gemma: 'gemini-test',
  },
}));

vi.mock('@/services/orchestrator', () => ({
  streamOrchestrate: vi.fn(),
}));

vi.mock('@/services/background-task-runner', () => ({
  runBackgroundTasks: vi.fn(),
}));

vi.mock('@/services/working-memory', () => ({
  updateWorkingMemory: vi.fn(),
}));

vi.mock('@/state', () => ({
  recordTutorTurn: vi.fn(),
  setTutorActivity: vi.fn(),
  filterByComposition: vi.fn().mockReturnValue([]),
  addRelation: vi.fn(),
}));

vi.mock('./useTutorProfile', () => ({
  useTutorProfile: () => ({
    buildProfile: vi.fn().mockResolvedValue(null),
    buildNotebookCtx: vi.fn().mockResolvedValue(null),
    student: { id: 's1', displayName: 'Test' },
    notebook: { id: 'nb1', title: 'Physics' },
    current: { number: 1, topic: 'Gravity' },
  }),
}));

vi.mock('./useCompoundResponse', () => ({
  useCompoundResponse: () => ({
    isLikelyCompound: vi.fn().mockReturnValue(false),
    executeCompound: vi.fn().mockResolvedValue(null),
    abort: vi.fn(),
  }),
}));

vi.mock('./tutor-helpers', () => ({
  delay: vi.fn().mockResolvedValue(undefined),
  inferTutorMode: vi.fn().mockReturnValue('confirmation'),
  extractTopics: vi.fn().mockReturnValue([]),
  executeDeferredAction: vi.fn(),
}));

describe('useGeminiTutor', () => {
  const addEntry = vi.fn();

  beforeEach(() => { vi.clearAllMocks(); });

  it('provides respond function', () => {
    const { result } = renderHook(() => useGeminiTutor({
      addEntry, entries: [],
    }));
    expect(typeof result.current.respond).toBe('function');
  });

  it('starts not thinking or streaming', () => {
    const { result } = renderHook(() => useGeminiTutor({
      addEntry, entries: [],
    }));
    expect(result.current.isThinking).toBe(false);
    expect(result.current.isStreaming).toBe(false);
  });

  it('does nothing when Gemini is not available', async () => {
    const { result } = renderHook(() => useGeminiTutor({
      addEntry, entries: [],
    }));
    await act(async () => {
      await result.current.respond({ type: 'prose', content: 'Hello' });
    });
    // Should not throw, should not add entries
    expect(result.current.isThinking).toBe(false);
  });

  it('does nothing for entries without content', async () => {
    const { isGeminiAvailable } = await import('@/services/gemini');
    vi.mocked(isGeminiAvailable).mockReturnValue(true);

    const { result } = renderHook(() => useGeminiTutor({
      addEntry, entries: [],
    }));
    await act(async () => {
      await result.current.respond({ type: 'silence' });
    });
    expect(result.current.isThinking).toBe(false);
  });
});
