/**
 * Tests for tutor-events — typed event system for the tutor pipeline.
 */
import { describe, test, expect, vi, beforeEach } from 'vitest';

vi.mock('@/state', () => ({
  setActivityDetail: vi.fn(),
}));

describe('tutor-events', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  test('emitTutorEvent sets activity detail for non-terminal events', async () => {
    const state = await import('@/state');
    const { emitTutorEvent } = await import('../tutor-events');

    emitTutorEvent({ type: 'thinking' });
    expect(state.setActivityDetail).toHaveBeenCalledWith(
      expect.objectContaining({ step: 'thinking' }),
    );
  });

  test('emitTutorEvent clears activity detail for complete event', async () => {
    const state = await import('@/state');
    const { emitTutorEvent } = await import('../tutor-events');

    emitTutorEvent({ type: 'complete', entryCount: 2 });
    expect(state.setActivityDetail).toHaveBeenCalledWith(null);
  });

  test('emitTutorEvent clears activity detail for error event', async () => {
    const state = await import('@/state');
    const { emitTutorEvent } = await import('../tutor-events');

    emitTutorEvent({ type: 'error', message: 'fail' });
    expect(state.setActivityDetail).toHaveBeenCalledWith(null);
  });

  test('emitTutorEvent returns the event', async () => {
    const { emitTutorEvent } = await import('../tutor-events');
    const event = { type: 'routing' as const };
    expect(emitTutorEvent(event)).toBe(event);
  });

  test('buildLabel for researching includes query', async () => {
    const state = await import('@/state');
    const { emitTutorEvent } = await import('../tutor-events');

    emitTutorEvent({ type: 'researching', query: 'quantum mechanics' });
    expect(state.setActivityDetail).toHaveBeenCalledWith(
      expect.objectContaining({
        label: expect.stringContaining('quantum mechanics'),
      }),
    );
  });

  test('buildLabel for refining includes pass info', async () => {
    const state = await import('@/state');
    const { emitTutorEvent } = await import('../tutor-events');

    emitTutorEvent({ type: 'refining', pass: 2, maxPasses: 3, target: 'html' });
    expect(state.setActivityDetail).toHaveBeenCalledWith(
      expect.objectContaining({
        step: 'refining',
        iteration: 2,
        maxIterations: 3,
      }),
    );
  });

  test('buildLabel truncates long strings', async () => {
    const state = await import('@/state');
    const { emitTutorEvent } = await import('../tutor-events');

    const longQuery = 'a'.repeat(50);
    emitTutorEvent({ type: 'researching', query: longQuery });
    const call = vi.mocked(state.setActivityDetail).mock.calls.at(-1);
    const detail = call?.[0] as { label: string } | null;
    expect(detail?.label?.length).toBeLessThan(60);
  });

  test('onTutorEvent registers and unregisters listeners', async () => {
    const { onTutorEvent, broadcastTutorEvent } = await import('../tutor-events');

    const listener = vi.fn();
    const unsubscribe = onTutorEvent(listener);

    broadcastTutorEvent({ type: 'thinking' });
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    broadcastTutorEvent({ type: 'thinking' });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  test('broadcastTutorEvent emits and broadcasts', async () => {
    const { onTutorEvent, broadcastTutorEvent } = await import('../tutor-events');

    const events: Array<{ type: string }> = [];
    onTutorEvent((e) => events.push(e));

    broadcastTutorEvent({ type: 'routing' });
    broadcastTutorEvent({ type: 'complete', entryCount: 1 });

    expect(events).toHaveLength(2);
    expect(events[0]?.type).toBe('routing');
    expect(events[1]?.type).toBe('complete');
  });
});
