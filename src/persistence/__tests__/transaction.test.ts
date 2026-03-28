/**
 * Tests for transaction — multi-store atomic operations.
 */
import { describe, test, expect, beforeEach } from 'vitest';
import { createMockIndexedDB } from '../../test/idb-mock';
import * as engine from '../engine';
import { transact } from '../transaction';

describe('transaction', () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, 'indexedDB', {
      value: createMockIndexedDB(),
      writable: true, configurable: true,
    });
    engine._resetForTest();
  });

  test('transact puts multiple records atomically', async () => {
    await engine.openDB();
    await transact([
      { store: 'entries', action: 'put', data: { id: 'e1', name: 'first' } },
      { store: 'entries', action: 'put', data: { id: 'e2', name: 'second' } },
    ]);
    const all = await engine.getAll('entries');
    expect(all).toHaveLength(2);
  });

  test('transact handles delete operations', async () => {
    await engine.openDB();
    await engine.put('entries', { id: 'e1', name: 'test' });
    await transact([
      { store: 'entries', action: 'delete', data: 'e1' },
    ]);
    const result = await engine.get('entries', 'e1');
    expect(result).toBeUndefined();
  });

  test('transact handles clear operations', async () => {
    await engine.openDB();
    await engine.put('entries', { id: 'e1' });
    await engine.put('entries', { id: 'e2' });
    await transact([{ store: 'entries', action: 'clear' }]);
    const all = await engine.getAll('entries');
    expect(all).toHaveLength(0);
  });

  test('transact across multiple stores', async () => {
    await engine.openDB();
    await transact([
      { store: 'entries', action: 'put', data: { id: 'e1' } },
      { store: 'sessions', action: 'put', data: { id: 's1' } },
    ]);
    const entries = await engine.getAll('entries');
    const sessions = await engine.getAll('sessions');
    expect(entries).toHaveLength(1);
    expect(sessions).toHaveLength(1);
  });
});
