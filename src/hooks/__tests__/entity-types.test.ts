/**
 * Tests for entity-types — fuzzyScore and Entity type definitions.
 */
import { describe, it, expect } from 'vitest';
import { fuzzyScore, type Entity, type EntityType } from '../entity-types';

describe('fuzzyScore', () => {
  it('returns 0 for empty query', () => {
    expect(fuzzyScore('', 'anything')).toBe(0);
  });

  it('scores exact substring match highest', () => {
    const score = fuzzyScore('hello', 'say hello world');
    expect(score).toBe(5); // length of query
  });

  it('returns -1 when chars are not all present', () => {
    expect(fuzzyScore('xyz', 'hello')).toBe(-1);
  });

  it('scores consecutive and scattered matches equally (char count)', () => {
    const consecutive = fuzzyScore('abc', 'abcdef');
    const scattered = fuzzyScore('abc', 'axbxcx');
    expect(consecutive).toBe(scattered); // both match 3 chars
  });

  it('is case insensitive', () => {
    expect(fuzzyScore('ABC', 'abcdef')).toBe(3);
    expect(fuzzyScore('abc', 'ABCDEF')).toBe(3);
  });

  it('handles single character query', () => {
    expect(fuzzyScore('a', 'apple')).toBe(1);
    expect(fuzzyScore('z', 'apple')).toBe(-1);
  });

  it('handles query longer than target', () => {
    expect(fuzzyScore('longquery', 'short')).toBe(-1);
  });

  it('scores fuzzy match with gaps', () => {
    const score = fuzzyScore('kpl', 'kepler');
    expect(score).toBeGreaterThan(0);
  });

  it('scores exact match', () => {
    expect(fuzzyScore('kepler', 'kepler')).toBe(6);
  });
});

describe('Entity type', () => {
  it('allows all valid entity types', () => {
    const types: EntityType[] = [
      'notebook', 'session', 'thinker', 'concept', 'term',
      'text', 'question', 'entry', 'slide', 'card',
      'exercise', 'code', 'diagram', 'image', 'file',
      'tutor-note', 'podcast',
    ];
    const entity: Entity = {
      id: 'test-id', type: types[0], name: 'Test', detail: 'Detail',
    };
    expect(entity.type).toBe('notebook');
  });

  it('supports optional fields', () => {
    const entity: Entity = {
      id: 'e1', type: 'concept', name: 'Gravity', detail: 'Force',
      notebookId: 'nb1', meta: 'physics', parentId: 'parent1',
    };
    expect(entity.notebookId).toBe('nb1');
    expect(entity.meta).toBe('physics');
    expect(entity.parentId).toBe('parent1');
  });
});
