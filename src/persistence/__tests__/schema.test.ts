/**
 * Tests for schema — DB name, version, store definitions.
 */
import { describe, test, expect } from 'vitest';
import { DB_NAME, DB_VERSION, Store, stores } from '../schema';

describe('schema', () => {
  test('DB_NAME is ember-notebook', () => {
    expect(DB_NAME).toBe('ember-notebook');
  });

  test('DB_VERSION is 5', () => {
    expect(DB_VERSION).toBe(5);
  });

  test('Store contains all expected stores', () => {
    expect(Store.Students).toBe('students');
    expect(Store.Notebooks).toBe('notebooks');
    expect(Store.Sessions).toBe('sessions');
    expect(Store.Entries).toBe('entries');
    expect(Store.Lexicon).toBe('lexicon');
    expect(Store.Encounters).toBe('encounters');
    expect(Store.Library).toBe('library');
    expect(Store.Mastery).toBe('mastery');
    expect(Store.Curiosities).toBe('curiosities');
    expect(Store.Blobs).toBe('blobs');
    expect(Store.Canvas).toBe('canvas');
    expect(Store.Relations).toBe('relations');
    expect(Store.Events).toBe('events');
  });

  test('stores array has definitions for all Store values', () => {
    const storeNames = Object.values(Store);
    for (const name of storeNames) {
      const def = stores.find((s) => s.name === name);
      expect(def, `Missing store definition for "${name}"`).toBeDefined();
    }
  });

  test('every store has a keyPath', () => {
    for (const def of stores) {
      expect(def.keyPath).toBeTruthy();
    }
  });

  test('Relations store has bidirectional indexes', () => {
    const relDef = stores.find((s) => s.name === Store.Relations);
    expect(relDef).toBeDefined();
    const idxNames = relDef!.indexes.map((i) => i.name);
    expect(idxNames).toContain('by-from');
    expect(idxNames).toContain('by-to');
    expect(idxNames).toContain('by-from-to');
  });
});
