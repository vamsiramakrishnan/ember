/**
 * Tests for session-state — in-memory state machine for tutor-learner sessions.
 */
import { describe, test, expect, beforeEach, vi } from 'vitest';

// Mock the persistence layer to avoid IndexedDB calls
vi.mock('../session-state-persistence', () => ({
  persistStudentTurn: vi.fn(),
  persistTutorTurn: vi.fn(),
  persistTutorActivity: vi.fn(),
  loadSessionState: vi.fn().mockResolvedValue(null),
  setSessionIds: vi.fn(),
}));

import {
  getSessionState,
  recordStudentTurn,
  recordTutorTurn,
  resetSession,
  subscribeSessionState,
} from '../session-state';
// SessionState type is implicitly tested via getSessionState return shape

describe('session-state', () => {
  beforeEach(() => {
    resetSession();
  });

  test('getSessionState returns initial state', () => {
    const state = getSessionState();
    expect(state.phase).toBe('opening');
    expect(state.studentTurnCount).toBe(0);
    expect(state.tutorTurnCount).toBe(0);
    expect(state.consecutiveTutorEntries).toBe(0);
    expect(state.lastTutorMode).toBeNull();
    expect(state.isThinking).toBe(false);
    expect(state.isStreaming).toBe(false);
    expect(state.coveredTopics).toEqual([]);
    expect(state.introducedThinkers).toEqual([]);
    expect(state.recentStudentTypes).toEqual([]);
    expect(state.activeConcepts).toEqual([]);
    expect(state.masterySnapshot).toEqual([]);
  });

  test('recordStudentTurn increments studentTurnCount', () => {
    recordStudentTurn('prose');
    const state = getSessionState();
    expect(state.studentTurnCount).toBe(1);
  });

  test('recordStudentTurn resets consecutiveTutorEntries', () => {
    recordTutorTurn('connection');
    recordTutorTurn('socratic');
    expect(getSessionState().consecutiveTutorEntries).toBe(2);
    recordStudentTurn('question');
    expect(getSessionState().consecutiveTutorEntries).toBe(0);
  });

  test('recordStudentTurn tracks recent entry types (max 3)', () => {
    recordStudentTurn('prose');
    recordStudentTurn('question');
    recordStudentTurn('hypothesis');
    recordStudentTurn('scratch');
    const state = getSessionState();
    expect(state.recentStudentTypes).toEqual(['scratch', 'hypothesis', 'question']);
  });

  test('recordTutorTurn increments tutorTurnCount', () => {
    recordTutorTurn('connection');
    expect(getSessionState().tutorTurnCount).toBe(1);
  });

  test('recordTutorTurn tracks mode', () => {
    recordTutorTurn('socratic');
    expect(getSessionState().lastTutorMode).toBe('socratic');
  });

  test('recordTutorTurn increments consecutiveTutorEntries', () => {
    recordTutorTurn('connection');
    recordTutorTurn('visual');
    expect(getSessionState().consecutiveTutorEntries).toBe(2);
  });

  test('recordTutorTurn accumulates covered topics', () => {
    recordTutorTurn('connection', ['orbital mechanics']);
    recordTutorTurn('socratic', ['harmonic series']);
    expect(getSessionState().coveredTopics).toEqual(['orbital mechanics', 'harmonic series']);
  });

  test('recordTutorTurn tracks introduced thinkers', () => {
    recordTutorTurn('connection', [], 'Kepler');
    recordTutorTurn('connection', [], 'Euler');
    expect(getSessionState().introducedThinkers).toEqual(['Kepler', 'Euler']);
  });

  test('recordTutorTurn without thinker does not add to list', () => {
    recordTutorTurn('socratic', ['topic']);
    expect(getSessionState().introducedThinkers).toEqual([]);
  });

  test('resetSession clears all state', () => {
    recordStudentTurn('prose');
    recordStudentTurn('question');
    recordTutorTurn('connection', ['topic'], 'Kepler');
    resetSession();
    const state = getSessionState();
    expect(state.studentTurnCount).toBe(0);
    expect(state.tutorTurnCount).toBe(0);
    expect(state.coveredTopics).toEqual([]);
    expect(state.introducedThinkers).toEqual([]);
    expect(state.phase).toBe('opening');
  });

  describe('phase transitions', () => {
    test('stays in opening with few turns', () => {
      recordStudentTurn('prose');
      recordTutorTurn('connection');
      expect(getSessionState().phase).toBe('opening');
    });

    test('transitions to exploration after enough turns', () => {
      // Need total > 4 but studentCount < 8
      for (let i = 0; i < 3; i++) {
        recordStudentTurn('prose');
        recordTutorTurn('connection');
      }
      // 3 student + 3 tutor = 6 total, student < 8
      expect(getSessionState().phase).toBe('exploration');
    });

    test('transitions to deepening with more student turns', () => {
      for (let i = 0; i < 9; i++) {
        recordStudentTurn('prose');
      }
      // 9 student + 0 tutor, student >= 8 but < 20
      expect(getSessionState().phase).toBe('deepening');
    });

    test('transitions to leaving-off with many student turns', () => {
      for (let i = 0; i < 20; i++) {
        recordStudentTurn('prose');
      }
      expect(getSessionState().phase).toBe('leaving-off');
    });
  });

  describe('subscribeSessionState', () => {
    test('fires listener on state changes', () => {
      const listener = vi.fn();
      subscribeSessionState(listener);
      recordStudentTurn('prose');
      expect(listener).toHaveBeenCalledTimes(1);
    });

    test('unsubscribe stops notifications', () => {
      const listener = vi.fn();
      const unsub = subscribeSessionState(listener);
      unsub();
      recordStudentTurn('prose');
      expect(listener).not.toHaveBeenCalled();
    });

    test('multiple subscribers all receive updates', () => {
      const a = vi.fn();
      const b = vi.fn();
      subscribeSessionState(a);
      subscribeSessionState(b);
      recordTutorTurn('socratic');
      expect(a).toHaveBeenCalledTimes(1);
      expect(b).toHaveBeenCalledTimes(1);
    });
  });
});
