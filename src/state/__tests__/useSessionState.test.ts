/**
 * Tests for useSessionState — React hook for the shared tutor-learner state.
 */
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';

vi.mock('../session-state-persistence', () => ({
  persistStudentTurn: vi.fn(),
  persistTutorTurn: vi.fn(),
  persistTutorActivity: vi.fn(),
  loadSessionState: vi.fn().mockResolvedValue(null),
  setSessionIds: vi.fn(),
}));

import { useSessionState } from '../useSessionState';
import { resetSession, recordStudentTurn } from '../session-state';

describe('useSessionState', () => {
  beforeEach(() => resetSession());

  test('returns current session state', () => {
    const { result } = renderHook(() => useSessionState());
    expect(result.current.phase).toBe('opening');
    expect(result.current.studentTurnCount).toBe(0);
  });

  test('updates when session state changes', () => {
    const { result } = renderHook(() => useSessionState());
    act(() => { recordStudentTurn('prose'); });
    expect(result.current.studentTurnCount).toBe(1);
  });
});
