/**
 * Tests for entry-graph-internals — shared types, mutable state, index helpers.
 */
import { describe, test, expect, beforeEach } from 'vitest';
import {
  relations, index, listeners, emit, addToIndex,
  type EntryRelation,
} from '../entry-graph-internals';

describe('entry-graph-internals', () => {
  beforeEach(() => {
    relations.length = 0;
    index.byFrom.clear();
    index.byTo.clear();
    index.byType.clear();
    listeners.clear();
  });

  describe('addToIndex', () => {
    test('indexes by from, to, and type', () => {
      const rel: EntryRelation = { from: 'a', to: 'b', type: 'follow-up' };
      addToIndex(rel);

      expect(index.byFrom.get('a')).toEqual([rel]);
      expect(index.byTo.get('b')).toEqual([rel]);
      expect(index.byType.get('follow-up')).toEqual([rel]);
    });

    test('appends to existing index entries', () => {
      const r1: EntryRelation = { from: 'a', to: 'b', type: 'follow-up' };
      const r2: EntryRelation = { from: 'a', to: 'c', type: 'references' };
      addToIndex(r1);
      addToIndex(r2);

      expect(index.byFrom.get('a')).toHaveLength(2);
    });

    test('creates separate entries for different from keys', () => {
      const r1: EntryRelation = { from: 'a', to: 'b', type: 'follow-up' };
      const r2: EntryRelation = { from: 'x', to: 'y', type: 'references' };
      addToIndex(r1);
      addToIndex(r2);

      expect(index.byFrom.get('a')).toHaveLength(1);
      expect(index.byFrom.get('x')).toHaveLength(1);
    });
  });

  describe('emit', () => {
    test('notifies all registered listeners', () => {
      let count = 0;
      listeners.add(() => { count++; });
      listeners.add(() => { count++; });
      emit();
      expect(count).toBe(2);
    });

    test('works with no listeners', () => {
      expect(() => emit()).not.toThrow();
    });
  });

  describe('relations array', () => {
    test('starts empty', () => {
      expect(relations).toHaveLength(0);
    });

    test('can be mutated directly', () => {
      relations.push({ from: 'a', to: 'b', type: 'echoes' });
      expect(relations).toHaveLength(1);
    });
  });
});
