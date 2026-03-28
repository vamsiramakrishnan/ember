/**
 * Tests for useTutorResponse — orchestrates tutor responses.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useTutorResponse } from '../useTutorResponse';

vi.mock('@/services/gemini', () => ({
  isGeminiAvailable: vi.fn().mockReturnValue(false),
}));

vi.mock('@/hooks/useGeminiTutor', () => ({
  useGeminiTutor: () => ({
    respond: vi.fn(),
    isThinking: false,
    isStreaming: false,
  }),
}));

describe('useTutorResponse', () => {
  const addEntry = vi.fn();
  const addEntries = vi.fn();

  beforeEach(() => { vi.clearAllMocks(); });

  it('provides respond function', () => {
    const { result } = renderHook(() =>
      useTutorResponse(addEntry, addEntries),
    );
    expect(typeof result.current.respond).toBe('function');
  });

  it('provides thinking and streaming state', () => {
    const { result } = renderHook(() =>
      useTutorResponse(addEntry, addEntries),
    );
    expect(result.current.isThinking).toBe(false);
    expect(result.current.isStreaming).toBe(false);
  });

  it('falls back to static responses when Gemini unavailable', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() =>
      useTutorResponse(addEntry, addEntries),
    );
    result.current.respond({ type: 'question', content: 'What is gravity?' });

    // Static fallback uses setTimeout
    vi.advanceTimersByTime(2000);
    expect(addEntry).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('cycles through static responses', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() =>
      useTutorResponse(addEntry, addEntries),
    );

    // Send multiple prose entries
    result.current.respond({ type: 'prose', content: 'First thought' });
    vi.advanceTimersByTime(2000);
    result.current.respond({ type: 'prose', content: 'Second thought' });
    vi.advanceTimersByTime(2000);

    expect(addEntry).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });
});
