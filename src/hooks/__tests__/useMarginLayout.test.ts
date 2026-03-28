/**
 * Tests for useMarginLayout — margin vs inline placement for tutor entries.
 */
import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useMarginLayout } from '../useMarginLayout';
import type { LiveEntry } from '@/types/entries';

function makeLive(id: string, type: string, content: string): LiveEntry {
  return {
    id, entry: { type, content } as LiveEntry['entry'],
    crossedOut: false, bookmarked: false, pinned: false, timestamp: Date.now(),
  };
}

describe('useMarginLayout', () => {
  it('returns empty result when disabled', () => {
    const entries = [
      makeLive('s1', 'prose', 'Student writes something long enough to test'),
      makeLive('t1', 'tutor-marginalia', 'Short note'),
    ];
    const { result } = renderHook(() => useMarginLayout(entries, false));
    expect(result.current.pairs).toHaveLength(0);
    expect(result.current.marginalized.size).toBe(0);
  });

  it('returns empty for fewer than 2 entries', () => {
    const entries = [makeLive('s1', 'prose', 'Single entry')];
    const { result } = renderHook(() => useMarginLayout(entries, true));
    expect(result.current.pairs).toHaveLength(0);
  });

  it('pairs a student entry with a following short tutor note', () => {
    const entries = [
      makeLive('s1', 'prose', 'This is a substantial student entry about ideas'),
      makeLive('t1', 'tutor-marginalia', 'Brief margin note'),
    ];
    const { result } = renderHook(() => useMarginLayout(entries, true));
    expect(result.current.pairs).toHaveLength(1);
    expect(result.current.marginalized.has('t1')).toBe(true);
    expect(result.current.isInMargin('t1')).toBe(true);
    expect(result.current.pairForStudent('s1')).toBeDefined();
  });

  it('does not pair when tutor content is too long', () => {
    const longContent = 'x'.repeat(201);
    const entries = [
      makeLive('s1', 'prose', 'A student entry with enough content to matter'),
      makeLive('t1', 'tutor-marginalia', longContent),
    ];
    const { result } = renderHook(() => useMarginLayout(entries, true));
    expect(result.current.pairs).toHaveLength(0);
  });

  it('does not pair when student content is too short', () => {
    const entries = [
      makeLive('s1', 'prose', 'Short'),
      makeLive('t1', 'tutor-marginalia', 'Note'),
    ];
    const { result } = renderHook(() => useMarginLayout(entries, true));
    expect(result.current.pairs).toHaveLength(0);
  });

  it('does not pair non-student types', () => {
    const entries = [
      makeLive('t0', 'tutor-question', 'This is the tutor asking a long question'),
      makeLive('t1', 'tutor-marginalia', 'Follow-up note'),
    ];
    const { result } = renderHook(() => useMarginLayout(entries, true));
    expect(result.current.pairs).toHaveLength(0);
  });

  it('does not pair non-margin tutor types', () => {
    const entries = [
      makeLive('s1', 'prose', 'Student writes something long enough for margin'),
      makeLive('t1', 'tutor-question', 'This is a Socratic question'),
    ];
    const { result } = renderHook(() => useMarginLayout(entries, true));
    expect(result.current.pairs).toHaveLength(0);
  });

  it('limits consecutive margin notes', () => {
    // Create 4 student-tutor pairs
    const entries: LiveEntry[] = [];
    for (let i = 0; i < 4; i++) {
      entries.push(makeLive(`s${i}`, 'prose', `Student entry ${i} that is long enough`));
      entries.push(makeLive(`t${i}`, 'tutor-marginalia', `Margin note ${i}`));
    }
    const { result } = renderHook(() => useMarginLayout(entries, true));
    // MAX_CONSECUTIVE_MARGIN is 3, so only 3 pairs
    expect(result.current.pairs.length).toBeLessThanOrEqual(3);
  });

  it('rejects entries with sketch markers', () => {
    const entries = [
      makeLive('s1', 'prose', 'Student writes something long enough to test'),
      makeLive('t1', 'tutor-marginalia', 'Note with [sketch:concept]'),
    ];
    const { result } = renderHook(() => useMarginLayout(entries, true));
    expect(result.current.pairs).toHaveLength(0);
  });

  it('pairs tutor-connection type', () => {
    const entries = [
      makeLive('s1', 'question', 'What connects these two ideas together?'),
      makeLive('t1', 'tutor-connection', 'Connection note'),
    ];
    const { result } = renderHook(() => useMarginLayout(entries, true));
    expect(result.current.pairs).toHaveLength(1);
  });
});
