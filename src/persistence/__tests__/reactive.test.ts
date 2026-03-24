/**
 * Tests for reactive write operations.
 * Verifies that writes go to IDB and trigger emitter notifications.
 */
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { createMockIndexedDB } from '../../test/idb-mock';

// Mock the oplog and blobQueue to isolate reactive write logic
vi.mock('../sync/oplog', () => ({
  recordOp: vi.fn().mockResolvedValue(undefined),
  recordOpBatch: vi.fn().mockResolvedValue(undefined),
  createOplogStores: vi.fn(),
}));

vi.mock('../sync/blobQueue', () => ({
  queueBlobUpload: vi.fn().mockResolvedValue(undefined),
}));

describe('reactive writes', () => {
  beforeEach(async () => {
    // Fresh IndexedDB for each test
    Object.defineProperty(globalThis, 'indexedDB', {
      value: createMockIndexedDB(),
      writable: true,
      configurable: true,
    });
    // Reset module cache so engine.ts gets a fresh dbInstance
    vi.resetModules();
    vi.clearAllMocks();
  });

  test('reactivePut writes to IDB and notifies', async () => {
    const { reactivePut } = await import('../reactive');
    const { subscribe } = await import('../emitter');
    const { get } = await import('../engine');

    const listener = vi.fn();
    subscribe('entries', listener);

    const record = { id: 'rp-1', content: 'hello' };
    await reactivePut('entries', record);

    // Verify the record was stored
    const stored = await get('entries', 'rp-1');
    expect(stored).toEqual(record);

    // Verify notification was sent
    expect(listener).toHaveBeenCalled();
  });

  test('reactiveDel removes from IDB and notifies', async () => {
    const { reactivePut, reactiveDel } = await import('../reactive');
    const { subscribe } = await import('../emitter');
    const { get } = await import('../engine');

    await reactivePut('entries', { id: 'rd-1', content: 'bye' });

    const listener = vi.fn();
    subscribe('entries', listener);

    await reactiveDel('entries', 'rd-1');

    const stored = await get('entries', 'rd-1');
    expect(stored).toBeUndefined();
    expect(listener).toHaveBeenCalled();
  });

  test('reactivePutBatch writes all records', async () => {
    const { reactivePutBatch } = await import('../reactive');
    const { getAll } = await import('../engine');

    const records = [
      { id: 'rb-1', value: 'a' },
      { id: 'rb-2', value: 'b' },
      { id: 'rb-3', value: 'c' },
    ];
    await reactivePutBatch('entries', records);

    const all = await getAll('entries');
    expect(all).toHaveLength(3);
  });
});
