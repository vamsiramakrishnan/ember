/**
 * Tests for the IDB storage engine.
 * Uses the mock IndexedDB from src/test/idb-mock.ts (loaded via setup.ts).
 */
import { describe, test, expect, beforeEach } from 'vitest';
import { createMockIndexedDB } from '../../test/idb-mock';
import * as engine from '../engine';

interface TestRecord {
  id: string;
  name: string;
  value: number;
}

describe('engine', () => {
  beforeEach(() => {
    // Fresh IndexedDB mock and reset cached DB instance
    Object.defineProperty(globalThis, 'indexedDB', {
      value: createMockIndexedDB(),
      writable: true,
      configurable: true,
    });
    engine._resetForTest();
  });

  test('openDB creates stores from schema', async () => {
    const db = await engine.openDB();
    expect(db).toBeDefined();
    // The mock's objectStoreNames.contains should work for schema-defined stores
    expect(db.objectStoreNames.contains('entries')).toBe(true);
    expect(db.objectStoreNames.contains('sessions')).toBe(true);
    expect(db.objectStoreNames.contains('lexicon')).toBe(true);
  });

  test('put + get roundtrip', async () => {
    const record: TestRecord = { id: 'test-1', name: 'alpha', value: 42 };
    await engine.put('entries', record);
    const result = await engine.get<TestRecord>('entries', 'test-1');
    expect(result).toEqual(record);
  });

  test('putBatch + getAll', async () => {
    const records: TestRecord[] = [
      { id: 'b-1', name: 'one', value: 1 },
      { id: 'b-2', name: 'two', value: 2 },
      { id: 'b-3', name: 'three', value: 3 },
    ];
    await engine.putBatch('entries', records);
    const all = await engine.getAll<TestRecord>('entries');
    expect(all).toHaveLength(3);
    expect(all.map((r) => r.id).sort()).toEqual(['b-1', 'b-2', 'b-3']);
  });

  test('del removes record', async () => {
    await engine.put('entries', { id: 'del-1', name: 'gone', value: 0 });
    await engine.del('entries', 'del-1');
    const result = await engine.get<TestRecord>('entries', 'del-1');
    expect(result).toBeUndefined();
  });

  test('patch atomically updates', async () => {
    const original: TestRecord = { id: 'patch-1', name: 'before', value: 10 };
    await engine.put('entries', original);
    const updated = await engine.patch<TestRecord & { id: string }>(
      'entries',
      'patch-1',
      (existing) => ({ ...existing, name: 'after', value: existing.value + 5 }),
    );
    expect(updated).toEqual({ id: 'patch-1', name: 'after', value: 15 });
  });

  test('count returns correct count', async () => {
    await engine.putBatch('entries', [
      { id: 'c-1', value: 1 },
      { id: 'c-2', value: 2 },
    ]);
    const n = await engine.count('entries');
    expect(n).toBe(2);
  });

  test('getByIndex returns matching records', async () => {
    await engine.putBatch('entries', [
      { id: 'i-1', sessionId: 'sess-a', type: 'prose' },
      { id: 'i-2', sessionId: 'sess-a', type: 'scratch' },
      { id: 'i-3', sessionId: 'sess-b', type: 'prose' },
    ]);
    const results = await engine.getByIndex<{ id: string; sessionId: string }>(
      'entries',
      'by-session',
      'sess-a',
    );
    expect(results).toHaveLength(2);
    expect(results.every((r) => r.sessionId === 'sess-a')).toBe(true);
  });
});
