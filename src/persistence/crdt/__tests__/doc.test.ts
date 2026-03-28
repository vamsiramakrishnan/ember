/**
 * Tests for the CRDT Document Manager (doc.ts).
 *
 * Verifies Y.Doc lifecycle, caching, store map access,
 * events array access, and error handling for invalid stores.
 */
import { describe, test, expect, beforeEach } from 'vitest';
import * as Y from 'yjs';
import { getDoc, destroyDoc, hasDoc, getStoreMap, getEventsArray } from '../doc';
import { Store } from '../../schema';

/** Unique notebook ID per test to avoid cross-test contamination. */
let notebookId: string;
let counter = 0;

beforeEach(() => {
  counter += 1;
  notebookId = `test-notebook-${counter}-${Date.now()}`;
});

describe('getDoc', () => {
  test('creates a new Y.Doc for a notebook', () => {
    const doc = getDoc(notebookId);
    expect(doc).toBeInstanceOf(Y.Doc);
  });

  test('returns the same doc on second call (caching)', () => {
    const first = getDoc(notebookId);
    const second = getDoc(notebookId);
    expect(second).toBe(first);
  });

  test('returns different docs for different notebooks', () => {
    const docA = getDoc('notebook-a');
    const docB = getDoc('notebook-b');
    expect(docA).not.toBe(docB);
    // Cleanup
    destroyDoc('notebook-a');
    destroyDoc('notebook-b');
  });
});

describe('destroyDoc', () => {
  test('cleans up and removes doc from cache', () => {
    getDoc(notebookId);
    expect(hasDoc(notebookId)).toBe(true);

    destroyDoc(notebookId);
    expect(hasDoc(notebookId)).toBe(false);
  });

  test('is a no-op for non-existent notebook', () => {
    // Should not throw
    destroyDoc('non-existent-notebook');
  });

  test('allows creating a fresh doc after destruction', () => {
    const first = getDoc(notebookId);
    destroyDoc(notebookId);
    const second = getDoc(notebookId);
    expect(second).not.toBe(first);
    destroyDoc(notebookId);
  });
});

describe('hasDoc', () => {
  test('returns false for non-existent doc', () => {
    expect(hasDoc('never-created')).toBe(false);
  });

  test('returns true after getDoc', () => {
    getDoc(notebookId);
    expect(hasDoc(notebookId)).toBe(true);
  });
});

describe('getStoreMap', () => {
  test('returns a Y.Map for a valid map store', () => {
    const map = getStoreMap(notebookId, Store.Sessions);
    expect(map).toBeInstanceOf(Y.Map);
  });

  test('returns the same Y.Map on repeated calls', () => {
    const first = getStoreMap(notebookId, Store.Entries);
    const second = getStoreMap(notebookId, Store.Entries);
    expect(second).toBe(first);
  });

  test('throws for events store', () => {
    expect(() => getStoreMap(notebookId, Store.Events)).toThrow(
      /append-only.*getEventsArray/i,
    );
  });

  test('throws for non-CRDT stores — students', () => {
    expect(() => getStoreMap(notebookId, Store.Students)).toThrow(
      /not managed by the CRDT layer/,
    );
  });

  test('throws for non-CRDT stores — notebooks', () => {
    expect(() => getStoreMap(notebookId, Store.Notebooks)).toThrow(
      /not managed by the CRDT layer/,
    );
  });

  test('throws for non-CRDT stores — blobs', () => {
    expect(() => getStoreMap(notebookId, Store.Blobs)).toThrow(
      /not managed by the CRDT layer/,
    );
  });
});

describe('getEventsArray', () => {
  test('returns a Y.Array', () => {
    const arr = getEventsArray(notebookId);
    expect(arr).toBeInstanceOf(Y.Array);
  });

  test('returns the same Y.Array on repeated calls', () => {
    const first = getEventsArray(notebookId);
    const second = getEventsArray(notebookId);
    expect(second).toBe(first);
  });
});
