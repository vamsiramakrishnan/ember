/**
 * Tests for composition-guard — enforces the compositional grammar.
 */
import { describe, test, expect, beforeEach, vi } from 'vitest';

vi.mock('../session-state-persistence', () => ({
  persistStudentTurn: vi.fn(),
  persistTutorTurn: vi.fn(),
  persistTutorActivity: vi.fn(),
  loadSessionState: vi.fn().mockResolvedValue(null),
  setSessionIds: vi.fn(),
}));

import { checkComposition, filterByComposition } from '../composition-guard';
import { resetSession, recordTutorTurn, recordStudentTurn } from '../session-state';
import type { NotebookEntry, LiveEntry } from '@/types/entries';

function makeLiveEntry(entry: NotebookEntry, id = 'e1'): LiveEntry {
  return {
    id, entry,
    crossedOut: false, bookmarked: false, pinned: false, timestamp: Date.now(),
  };
}

describe('composition-guard', () => {
  beforeEach(() => {
    resetSession();
  });

  test('system types always pass', () => {
    const silence = { type: 'silence' as const, text: '...' };
    const verdict = checkComposition(silence, []);
    expect(verdict.action).toBe('emit');
  });

  test('allows first tutor entry', () => {
    const marginalia = { type: 'tutor-marginalia' as const, content: 'test' };
    const verdict = checkComposition(marginalia, []);
    expect(verdict.action).toBe('emit');
  });

  test('defers third consecutive tutor entry', () => {
    recordTutorTurn('connection');
    recordTutorTurn('socratic');
    const marginalia = { type: 'tutor-marginalia' as const, content: 'third' };
    const verdict = checkComposition(marginalia, []);
    expect(verdict.action).toBe('defer');
  });

  test('allows tutor entry after student resets consecutive count', () => {
    recordTutorTurn('connection');
    recordTutorTurn('socratic');
    recordStudentTurn('prose');
    const marginalia = { type: 'tutor-marginalia' as const, content: 'ok' };
    const verdict = checkComposition(marginalia, []);
    expect(verdict.action).toBe('emit');
  });

  test('suppresses duplicate thinker introduction', () => {
    recordTutorTurn('connection', [], 'Kepler');
    const thinkerCard = {
      type: 'thinker-card' as const,
      thinker: { name: 'Kepler', dates: '1571-1630', gift: 'test', bridge: 'test' },
    };
    const verdict = checkComposition(thinkerCard, []);
    expect(verdict.action).toBe('suppress');
  });

  test('allows first thinker introduction', () => {
    const thinkerCard = {
      type: 'thinker-card' as const,
      thinker: { name: 'Euler', dates: '1707-1783', gift: 'test', bridge: 'test' },
    };
    const verdict = checkComposition(thinkerCard, []);
    expect(verdict.action).toBe('emit');
  });

  test('allows echo (system type) even within 5 entries of previous echo', () => {
    // echo is in SYSTEM_TYPES, so it always passes the composition guard
    const entries: LiveEntry[] = [
      makeLiveEntry({ type: 'prose' as const, content: 'a' }, 'e1'),
      makeLiveEntry({ type: 'echo' as const, content: 'echo' }, 'e2'),
      makeLiveEntry({ type: 'prose' as const, content: 'b' }, 'e3'),
      makeLiveEntry({ type: 'prose' as const, content: 'c' }, 'e4'),
    ];
    const echo = { type: 'echo' as const, content: 'another echo',  };
    const verdict = checkComposition(echo, entries);
    expect(verdict.action).toBe('emit');
  });

  test('allows echo after 5+ entries', () => {
    const entries: LiveEntry[] = Array.from({ length: 6 }, (_, i) =>
      makeLiveEntry({ type: 'prose' as const, content: `text ${i}` }, `e${i}`),
    );
    // Put echo at the beginning (index 0)
    entries[0] = makeLiveEntry(
      { type: 'echo' as const, content: 'old echo' },
      'echo-0',
    );
    const echo = { type: 'echo' as const, content: 'new echo',  };
    const verdict = checkComposition(echo, entries);
    expect(verdict.action).toBe('emit');
  });

  test('filterByComposition returns only emittable entries', () => {
    const proposed: NotebookEntry[] = [
      { type: 'silence' as const, text: '' },
      { type: 'tutor-marginalia' as const, content: 'ok' },
    ];
    const result = filterByComposition(proposed, []);
    expect(result).toHaveLength(2);
  });
});
