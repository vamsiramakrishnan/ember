/**
 * Tests for session-state-persistence — bridges in-memory state to event log.
 */
import { describe, test, expect, beforeEach, vi } from 'vitest';

vi.mock('@/persistence/repositories/events', () => ({
  appendEvent: vi.fn().mockResolvedValue({}),
  getSessionEvents: vi.fn().mockResolvedValue([]),
  deriveSessionState: vi.fn().mockReturnValue({
    phase: 'exploration',
    studentTurnCount: 5,
    tutorTurnCount: 3,
    consecutiveTutorEntries: 1,
    lastTutorMode: 'connection',
    coveredTopics: ['orbits'],
    introducedThinkers: ['Kepler'],
    recentStudentTypes: ['prose', 'question'],
    activeConcepts: [{ id: 'c1', term: 'Harmony' }],
  }),
}));

import {
  setSessionIds, getCurrentNotebookId, getCurrentSessionId,
  persistStudentTurn, persistTutorTurn, persistTutorActivity,
  loadSessionState,
} from '../session-state-persistence';
import { appendEvent, getSessionEvents, deriveSessionState } from '@/persistence/repositories/events';

describe('session-state-persistence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setSessionIds('', '');
  });

  describe('setSessionIds / getters', () => {
    test('stores and retrieves notebook and session IDs', () => {
      setSessionIds('nb-1', 'sess-1');
      expect(getCurrentNotebookId()).toBe('nb-1');
      expect(getCurrentSessionId()).toBe('sess-1');
    });
  });

  describe('persistStudentTurn', () => {
    test('does nothing without session ID', () => {
      persistStudentTurn('prose');
      expect(appendEvent).not.toHaveBeenCalled();
    });

    test('appends student-turn event with session ID set', () => {
      setSessionIds('nb-1', 'sess-1');
      persistStudentTurn('question');
      expect(appendEvent).toHaveBeenCalledWith(
        'nb-1', 'sess-1',
        expect.objectContaining({ type: 'student-turn', entryType: 'question' }),
      );
    });
  });

  describe('persistTutorTurn', () => {
    test('does nothing without session ID', () => {
      persistTutorTurn('connection', ['topic']);
      expect(appendEvent).not.toHaveBeenCalled();
    });

    test('appends tutor-turn event', () => {
      setSessionIds('nb-1', 'sess-1');
      persistTutorTurn('socratic', ['orbits'], 'Kepler');
      expect(appendEvent).toHaveBeenCalledWith(
        'nb-1', 'sess-1',
        expect.objectContaining({
          type: 'tutor-turn',
          mode: 'socratic',
          topics: ['orbits'],
          thinker: 'Kepler',
        }),
      );
    });
  });

  describe('persistTutorActivity', () => {
    test('appends tutor-thinking event', () => {
      setSessionIds('nb-1', 'sess-1');
      persistTutorActivity(true, false);
      expect(appendEvent).toHaveBeenCalledWith(
        'nb-1', 'sess-1',
        expect.objectContaining({ type: 'tutor-thinking', isThinking: true, isStreaming: false }),
      );
    });
  });

  describe('loadSessionState', () => {
    test('returns null for empty event log', async () => {
      vi.mocked(getSessionEvents).mockResolvedValue([]);
      const result = await loadSessionState('nb-1', 'sess-1');
      expect(result).toBeNull();
    });

    test('returns derived state from events', async () => {
      vi.mocked(getSessionEvents).mockResolvedValue([{ id: 'ev1' }] as ReturnType<typeof getSessionEvents> extends Promise<infer T> ? T : never);
      const result = await loadSessionState('nb-2', 'sess-2');
      expect(result).not.toBeNull();
      expect(result!.phase).toBe('exploration');
      expect(result!.studentTurnCount).toBe(5);
      expect(result!.introducedThinkers).toContain('Kepler');
    });

    test('sets session IDs as side effect', async () => {
      await loadSessionState('nb-3', 'sess-3');
      expect(getCurrentNotebookId()).toBe('nb-3');
      expect(getCurrentSessionId()).toBe('sess-3');
    });
  });
});
