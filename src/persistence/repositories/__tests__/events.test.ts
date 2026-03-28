/**
 * Tests for events repository — append-only collaboration event log.
 */
import { describe, test, expect, beforeEach, vi } from 'vitest';

vi.mock('../../engine', () => ({
  put: vi.fn().mockResolvedValue(undefined),
  getByIndex: vi.fn().mockResolvedValue([]),
}));
vi.mock('../../emitter', () => ({
  notify: vi.fn(),
}));
vi.mock('../../sync/oplog', () => ({
  recordOp: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('../../ids', () => ({
  createId: vi.fn().mockReturnValue('event-id'),
}));

import { appendEvent, getSessionEvents, deriveSessionState } from '../events';
import { put, getByIndex } from '../../engine';

describe('events repository', () => {
  beforeEach(() => vi.clearAllMocks());

  test('appendEvent puts record and returns it', async () => {
    const event = { type: 'student-turn' as const, entryId: 'e1', entryType: 'prose' as const, timestamp: 1000 };
    const result = await appendEvent('nb1', 'sess1', event);
    expect(result.id).toBe('event-id');
    expect(result.sessionId).toBe('sess1');
    expect(put).toHaveBeenCalledOnce();
  });

  test('getSessionEvents sorts by timestamp', async () => {
    vi.mocked(getByIndex).mockResolvedValue([
      { id: 'ev2', timestamp: 200 },
      { id: 'ev1', timestamp: 100 },
    ]);
    const result = await getSessionEvents('sess1');
    expect(result[0]!.id).toBe('ev1');
  });

  describe('deriveSessionState', () => {
    test('returns initial state for empty events', () => {
      const state = deriveSessionState([]);
      expect(state.phase).toBe('opening');
      expect(state.studentTurnCount).toBe(0);
      expect(state.tutorTurnCount).toBe(0);
    });

    test('counts student turns and resets consecutive', () => {
      const state = deriveSessionState([
        { id: '1', notebookId: 'nb1', sessionId: 's1', timestamp: 100, event: { type: 'student-turn', entryId: 'e1', entryType: 'prose', timestamp: 100 } },
        { id: '2', notebookId: 'nb1', sessionId: 's1', timestamp: 200, event: { type: 'tutor-turn', entryId: 'e2', mode: 'connection', topics: ['t1'], timestamp: 200 } },
        { id: '3', notebookId: 'nb1', sessionId: 's1', timestamp: 300, event: { type: 'student-turn', entryId: 'e3', entryType: 'question', timestamp: 300 } },
      ]);
      expect(state.studentTurnCount).toBe(2);
      expect(state.tutorTurnCount).toBe(1);
      expect(state.consecutiveTutorEntries).toBe(0);
    });

    test('tracks tutor mode and topics', () => {
      const state = deriveSessionState([
        { id: '1', notebookId: 'nb1', sessionId: 's1', timestamp: 100, event: { type: 'tutor-turn', entryId: 'e1', mode: 'socratic', topics: ['orbits'], thinker: 'Kepler', timestamp: 100 } },
      ]);
      expect(state.lastTutorMode).toBe('socratic');
      expect(state.coveredTopics).toContain('orbits');
      expect(state.introducedThinkers).toContain('Kepler');
    });

    test('handles tutor-thinking events', () => {
      const state = deriveSessionState([
        { id: '1', notebookId: 'nb1', sessionId: 's1', timestamp: 100, event: { type: 'tutor-thinking', isThinking: true, isStreaming: false, timestamp: 100 } },
      ]);
      expect(state.isThinking).toBe(true);
      expect(state.isStreaming).toBe(false);
    });

    test('handles concept activation/deactivation', () => {
      const state = deriveSessionState([
        { id: '1', notebookId: 'nb1', sessionId: 's1', timestamp: 100, event: { type: 'concept-activated', conceptId: 'c1', term: 'Ratio', timestamp: 100 } },
        { id: '2', notebookId: 'nb1', sessionId: 's1', timestamp: 200, event: { type: 'concept-deactivated', conceptId: 'c1', timestamp: 200 } },
      ]);
      expect(state.activeConcepts).toHaveLength(0);
    });

    test('phase transition with enough turns', () => {
      const events = [];
      for (let i = 0; i < 5; i++) {
        events.push({
          id: `s${i}`, notebookId: 'nb1', sessionId: 's1', timestamp: i * 100,
          event: { type: 'student-turn' as const, entryId: `e${i}`, entryType: 'prose' as const, timestamp: i * 100 },
        });
      }
      const state = deriveSessionState(events);
      expect(state.phase).toBe('exploration');
    });
  });
});
