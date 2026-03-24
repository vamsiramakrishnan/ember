/**
 * Tests for the pub-sub store emitter.
 */
import { describe, test, expect, vi } from 'vitest';
import { subscribe, notify, notifyStores } from '../emitter';

describe('emitter', () => {
  test('subscribe + notify fires listener', () => {
    const listener = vi.fn();
    subscribe('entries', listener);
    notify('entries');
    expect(listener).toHaveBeenCalledTimes(1);
  });

  test('unsubscribe stops notifications', () => {
    const listener = vi.fn();
    const unsub = subscribe('entries', listener);
    unsub();
    notify('entries');
    expect(listener).not.toHaveBeenCalled();
  });

  test('notifyStores batches via microtask', async () => {
    const entriesListener = vi.fn();
    const sessionsListener = vi.fn();
    subscribe('entries', entriesListener);
    subscribe('sessions', sessionsListener);

    notifyStores(['entries', 'sessions']);

    // Listeners should not be called synchronously
    expect(entriesListener).not.toHaveBeenCalled();
    expect(sessionsListener).not.toHaveBeenCalled();

    // Wait for microtask to flush
    await Promise.resolve();

    expect(entriesListener).toHaveBeenCalledTimes(1);
    expect(sessionsListener).toHaveBeenCalledTimes(1);
  });

  test('multiple subscribers all receive notifications', () => {
    const listenerA = vi.fn();
    const listenerB = vi.fn();
    const listenerC = vi.fn();
    subscribe('lexicon', listenerA);
    subscribe('lexicon', listenerB);
    subscribe('lexicon', listenerC);

    notify('lexicon');

    expect(listenerA).toHaveBeenCalledTimes(1);
    expect(listenerB).toHaveBeenCalledTimes(1);
    expect(listenerC).toHaveBeenCalledTimes(1);
  });
});
