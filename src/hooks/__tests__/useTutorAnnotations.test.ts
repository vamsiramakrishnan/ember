/**
 * Tests for useTutorAnnotations — proactive AI annotations on student blocks.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTutorAnnotations } from '../useTutorAnnotations';
import type { LiveEntry } from '@/types/entries';

vi.mock('@/services/gemini', () => ({
  isGeminiAvailable: vi.fn().mockReturnValue(false),
}));

vi.mock('@/services/agents', () => ({
  TUTOR_AGENT: { name: 'tutor' },
}));

vi.mock('@/services/run-agent', () => ({
  runTextAgent: vi.fn().mockResolvedValue({ text: 'Insightful note' }),
}));

vi.mock('@/services/file-search', () => ({
  getOrCreateStore: vi.fn().mockResolvedValue('store'),
  searchNotebook: vi.fn().mockResolvedValue({ text: '' }),
}));

vi.mock('@/contexts/StudentContext', () => ({
  useStudent: () => ({
    student: { id: 's1' },
    notebook: { id: 'nb1' },
  }),
}));

vi.mock('@/persistence/ids', () => ({
  createId: () => 'annot-id',
}));

function makeLive(id: string, type: string, content: string): LiveEntry {
  return {
    id, entry: { type, content } as LiveEntry['entry'],
    crossedOut: false, bookmarked: false, pinned: false, timestamp: Date.now(),
  };
}

describe('useTutorAnnotations', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('provides maybeAnnotate callback', () => {
    const onAnnotate = vi.fn();
    const { result } = renderHook(() => useTutorAnnotations({ onAnnotate }));
    expect(typeof result.current.maybeAnnotate).toBe('function');
  });

  it('does not annotate when Gemini is unavailable', async () => {
    const onAnnotate = vi.fn();
    const { result } = renderHook(() => useTutorAnnotations({ onAnnotate }));

    const entries = Array.from({ length: 8 }, (_, i) =>
      makeLive(`e${i}`, 'prose', `Entry ${i} with enough content to qualify`),
    );

    // Call 8 times to hit the cycle interval
    for (let i = 0; i < 8; i++) {
      await act(async () => { await result.current.maybeAnnotate(entries); });
    }

    expect(onAnnotate).not.toHaveBeenCalled();
  });

  it('respects cycle interval (every 8 entries)', async () => {
    const onAnnotate = vi.fn();
    const { result } = renderHook(() => useTutorAnnotations({ onAnnotate }));

    const entries = [makeLive('e1', 'prose', 'Short')];

    // First 7 calls should not trigger
    for (let i = 0; i < 7; i++) {
      await act(async () => { await result.current.maybeAnnotate(entries); });
    }
    expect(onAnnotate).not.toHaveBeenCalled();
  });
});
