/**
 * Tests for CRDT reactive writes (reactive-crdt.ts).
 *
 * Verifies that crdtPut, crdtDel, and crdtPutBatch correctly
 * modify Y.Doc structures (Y.Map and Y.Array) without needing IDB.
 */
import { describe, test, expect, beforeEach } from 'vitest';
import { crdtPut, crdtDel, crdtPutBatch } from '../reactive-crdt';
import { getStoreMap, getEventsArray, destroyDoc } from '../doc';
import { Store } from '../../schema';

interface TestRecord {
  id: string;
  value: string;
}

let notebookId: string;
let counter = 0;

beforeEach(() => {
  counter += 1;
  notebookId = `crdt-test-${counter}-${Date.now()}`;
});

describe('crdtPut', () => {
  test('writes record to Y.Map', () => {
    const record: TestRecord = { id: 'rec-1', value: 'hello' };
    crdtPut(notebookId, Store.Entries, record);

    const ymap = getStoreMap(notebookId, Store.Entries);
    expect(ymap.get('rec-1')).toEqual(record);
    destroyDoc(notebookId);
  });

  test('overwrites existing record with same id', () => {
    crdtPut(notebookId, Store.Entries, { id: 'rec-1', value: 'first' });
    crdtPut(notebookId, Store.Entries, { id: 'rec-1', value: 'second' });

    const ymap = getStoreMap(notebookId, Store.Entries);
    expect(ymap.get('rec-1')).toEqual({ id: 'rec-1', value: 'second' });
    destroyDoc(notebookId);
  });

  test('appends event to Y.Array when store is events', () => {
    const event: TestRecord = { id: 'evt-1', value: 'clicked' };
    crdtPut(notebookId, Store.Events, event);

    const arr = getEventsArray(notebookId);
    expect(arr.length).toBe(1);
    expect(arr.get(0)).toEqual(event);
    destroyDoc(notebookId);
  });

  test('throws for non-CRDT store', () => {
    expect(() =>
      crdtPut(notebookId, Store.Students, { id: 's-1', value: 'x' }),
    ).toThrow(/not managed by the CRDT layer/);
  });
});

describe('crdtDel', () => {
  test('removes record from Y.Map', () => {
    crdtPut(notebookId, Store.Lexicon, { id: 'lex-1', value: 'word' });
    const ymap = getStoreMap(notebookId, Store.Lexicon);
    expect(ymap.has('lex-1')).toBe(true);

    crdtDel(notebookId, Store.Lexicon, 'lex-1');
    expect(ymap.has('lex-1')).toBe(false);
    destroyDoc(notebookId);
  });

  test('throws for events store', () => {
    expect(() => crdtDel(notebookId, Store.Events, 'evt-1')).toThrow(
      /append-only/,
    );
  });

  test('is a no-op for non-existent key', () => {
    // Should not throw when deleting a key that was never set
    crdtDel(notebookId, Store.Sessions, 'does-not-exist');
    const ymap = getStoreMap(notebookId, Store.Sessions);
    expect(ymap.size).toBe(0);
    destroyDoc(notebookId);
  });
});

describe('crdtPutBatch', () => {
  test('writes multiple records in single transaction', () => {
    const records: TestRecord[] = [
      { id: 'a', value: '1' },
      { id: 'b', value: '2' },
      { id: 'c', value: '3' },
    ];
    crdtPutBatch(notebookId, Store.Mastery, records);

    const ymap = getStoreMap(notebookId, Store.Mastery);
    expect(ymap.size).toBe(3);
    expect(ymap.get('a')).toEqual({ id: 'a', value: '1' });
    expect(ymap.get('b')).toEqual({ id: 'b', value: '2' });
    expect(ymap.get('c')).toEqual({ id: 'c', value: '3' });
    destroyDoc(notebookId);
  });

  test('with events appends all to Y.Array', () => {
    const events: TestRecord[] = [
      { id: 'e1', value: 'first' },
      { id: 'e2', value: 'second' },
    ];
    crdtPutBatch(notebookId, Store.Events, events);

    const arr = getEventsArray(notebookId);
    expect(arr.length).toBe(2);
    expect(arr.get(0)).toEqual({ id: 'e1', value: 'first' });
    expect(arr.get(1)).toEqual({ id: 'e2', value: 'second' });
    destroyDoc(notebookId);
  });

  test('is a no-op for empty records array', () => {
    crdtPutBatch(notebookId, Store.Canvas, []);
    const ymap = getStoreMap(notebookId, Store.Canvas);
    expect(ymap.size).toBe(0);
    destroyDoc(notebookId);
  });

  test('throws for non-CRDT store', () => {
    expect(() =>
      crdtPutBatch(notebookId, Store.Notebooks, [{ id: 'n-1', value: 'x' }]),
    ).toThrow(/not managed by the CRDT layer/);
  });
});
