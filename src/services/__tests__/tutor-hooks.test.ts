/**
 * Tests for tutor-hooks — pedagogical guardrails as lifecycle hooks.
 */
import { describe, test, expect, vi, beforeEach } from 'vitest';

vi.mock('@/state', () => ({
  getSessionState: vi.fn(() => ({
    consecutiveTutorEntries: 0,
    phase: 'exploring',
    studentTurnCount: 0,
  })),
}));

describe('tutor-hooks', () => {
  beforeEach(async () => {
    vi.resetModules();
  });

  test('registerHook and runHooks — allow by default', async () => {
    const { runHooks, registerHook } = await import('../tutor-hooks');
    const unsubscribe = registerHook('pre-response', () => ({ action: 'allow' }));

    const result = runHooks({
      phase: 'pre-response',
      studentText: 'test',
      routing: { tutor: true, research: false, visualize: false, illustrate: false, deepMemory: false, directive: false, reason: '' } as import('../router-agent').RoutingDecision,
      entries: [],
    });
    expect(result.action).toBe('allow');
    unsubscribe();
  });

  test('first block wins', async () => {
    const { runHooks, registerHook } = await import('../tutor-hooks');
    const u1 = registerHook('pre-response', () => ({ action: 'block', reason: 'first' }));
    const u2 = registerHook('pre-response', () => ({ action: 'block', reason: 'second' }));

    const result = runHooks({
      phase: 'pre-response',
      studentText: '',
      routing: { tutor: true, research: false, visualize: false, illustrate: false, deepMemory: false, directive: false, reason: '' } as import('../router-agent').RoutingDecision,
      entries: [],
    });
    expect(result).toEqual({ action: 'block', reason: 'first' });
    u1();
    u2();
  });

  test('modifications accumulate', async () => {
    const { runHooks, registerHook } = await import('../tutor-hooks');
    const u1 = registerHook('pre-response', () => ({
      action: 'modify',
      overrides: { visualize: false },
    }));
    const u2 = registerHook('pre-response', () => ({
      action: 'modify',
      overrides: { illustrate: false },
    }));

    const result = runHooks({
      phase: 'pre-response',
      studentText: '',
      routing: { tutor: true, research: false, visualize: true, illustrate: true, deepMemory: false, directive: false, reason: '' } as import('../router-agent').RoutingDecision,
      entries: [],
    });
    expect(result.action).toBe('modify');
    if (result.action === 'modify') {
      expect(result.overrides.visualize).toBe(false);
      expect(result.overrides.illustrate).toBe(false);
    }
    u1();
    u2();
  });

  test('unsubscribe removes hook', async () => {
    const { runHooks, registerHook } = await import('../tutor-hooks');
    const hook = vi.fn(() => ({ action: 'allow' as const }));
    const unsubscribe = registerHook('pre-response', hook);
    unsubscribe();

    runHooks({
      phase: 'pre-response',
      studentText: '',
      routing: {} as import('../router-agent').RoutingDecision,
      entries: [],
    });
    expect(hook).not.toHaveBeenCalled();
  });

  test('quietDownHook modifies when too many consecutive tutor entries', async () => {
    const state = await import('@/state');
    vi.mocked(state.getSessionState).mockReturnValue({
      consecutiveTutorEntries: 3,
      phase: 'exploring',
      studentTurnCount: 0,
    } as ReturnType<typeof state.getSessionState>);

    const { quietDownHook } = await import('../tutor-hooks');
    const result = quietDownHook({
      phase: 'pre-enrichment',
      studentText: '',
      routing: {} as import('../router-agent').RoutingDecision,
      entries: [],
    });
    expect(result.action).toBe('modify');
    if (result.action === 'modify') {
      expect(result.overrides.visualize).toBe(false);
    }
  });

  test('quietDownHook allows when few consecutive entries', async () => {
    const state = await import('@/state');
    vi.mocked(state.getSessionState).mockReturnValue({
      consecutiveTutorEntries: 1,
      phase: 'exploring',
      studentTurnCount: 0,
    } as ReturnType<typeof state.getSessionState>);

    const { quietDownHook } = await import('../tutor-hooks');
    const result = quietDownHook({
      phase: 'pre-enrichment',
      studentText: '',
      routing: {} as import('../router-agent').RoutingDecision,
      entries: [],
    });
    expect(result.action).toBe('allow');
  });

  test('openingPhaseHook modifies during opening phase', async () => {
    const state = await import('@/state');
    vi.mocked(state.getSessionState).mockReturnValue({
      consecutiveTutorEntries: 0,
      phase: 'opening',
      studentTurnCount: 0,
    } as ReturnType<typeof state.getSessionState>);

    const { openingPhaseHook } = await import('../tutor-hooks');
    const result = openingPhaseHook({
      phase: 'pre-enrichment',
      studentText: '',
      routing: {} as import('../router-agent').RoutingDecision,
      entries: [],
    });
    expect(result.action).toBe('modify');
  });

  test('closingReflectionHook blocks when no reflection and many turns', async () => {
    const state = await import('@/state');
    vi.mocked(state.getSessionState).mockReturnValue({
      consecutiveTutorEntries: 0,
      phase: 'exploring',
      studentTurnCount: 6,
    } as ReturnType<typeof state.getSessionState>);

    const { closingReflectionHook } = await import('../tutor-hooks');
    const result = closingReflectionHook({
      phase: 'session-end',
      studentText: '',
      routing: {} as import('../router-agent').RoutingDecision,
      entries: [{ type: 'prose', content: 'student text' }],
    });
    expect(result.action).toBe('block');
  });

  test('closingReflectionHook allows when not session-end phase', async () => {
    const { closingReflectionHook } = await import('../tutor-hooks');
    const result = closingReflectionHook({
      phase: 'pre-response',
      studentText: '',
      routing: {} as import('../router-agent').RoutingDecision,
      entries: [],
    });
    expect(result.action).toBe('allow');
  });
});
