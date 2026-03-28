/**
 * Tests for entry-graph-queries — read-only traversal of the entry graph.
 */
import { describe, test, expect, beforeEach } from 'vitest';
import { relations, index, addToIndex } from '../entry-graph-internals';
import type { EntryRelation } from '../entry-graph-internals';
import {
  getPrompters, getFollowUps, getReferences,
  getOutgoing, getIncoming, getFollowUpChain, getByType,
} from '../entry-graph-queries';

function addRel(rel: EntryRelation) {
  relations.push(rel);
  addToIndex(rel);
}

describe('entry-graph-queries', () => {
  beforeEach(() => {
    relations.length = 0;
    index.byFrom.clear();
    index.byTo.clear();
    index.byType.clear();
  });

  test('getPrompters returns prompted-by relations targeting the entry', () => {
    addRel({ from: 'tutor-1', to: 'student-1', type: 'prompted-by' });
    addRel({ from: 'tutor-2', to: 'student-1', type: 'follow-up' });

    const result = getPrompters('student-1');
    expect(result).toHaveLength(1);
    expect(result[0]!.from).toBe('tutor-1');
  });

  test('getFollowUps returns follow-up relations from the entry', () => {
    addRel({ from: 'a', to: 'b', type: 'follow-up' });
    addRel({ from: 'a', to: 'c', type: 'follow-up' });
    addRel({ from: 'a', to: 'd', type: 'references' });

    expect(getFollowUps('a')).toHaveLength(2);
  });

  test('getReferences returns references targeting the entry', () => {
    addRel({ from: 'x', to: 'target', type: 'references' });
    expect(getReferences('target')).toHaveLength(1);
  });

  test('getOutgoing returns all relations from an entry', () => {
    addRel({ from: 'a', to: 'b', type: 'follow-up' });
    addRel({ from: 'a', to: 'c', type: 'references' });
    expect(getOutgoing('a')).toHaveLength(2);
  });

  test('getIncoming returns all relations to an entry', () => {
    addRel({ from: 'x', to: 'target', type: 'echoes' });
    addRel({ from: 'y', to: 'target', type: 'references' });
    expect(getIncoming('target')).toHaveLength(2);
  });

  test('getOutgoing returns empty array for unknown entry', () => {
    expect(getOutgoing('nonexistent')).toEqual([]);
  });

  test('getByType returns all relations of a given type', () => {
    addRel({ from: 'a', to: 'b', type: 'echoes' });
    addRel({ from: 'c', to: 'd', type: 'echoes' });
    addRel({ from: 'e', to: 'f', type: 'follow-up' });

    expect(getByType('echoes')).toHaveLength(2);
    expect(getByType('follow-up')).toHaveLength(1);
    expect(getByType('contradicts')).toEqual([]);
  });

  describe('getFollowUpChain', () => {
    test('follows a linear chain', () => {
      addRel({ from: 'a', to: 'b', type: 'follow-up' });
      addRel({ from: 'b', to: 'c', type: 'follow-up' });
      addRel({ from: 'c', to: 'd', type: 'follow-up' });

      expect(getFollowUpChain('a')).toEqual(['a', 'b', 'c', 'd']);
    });

    test('stops at dead end', () => {
      addRel({ from: 'a', to: 'b', type: 'follow-up' });
      expect(getFollowUpChain('a')).toEqual(['a', 'b']);
    });

    test('returns single element for no follow-ups', () => {
      expect(getFollowUpChain('lonely')).toEqual(['lonely']);
    });

    test('breaks on cycles', () => {
      addRel({ from: 'a', to: 'b', type: 'follow-up' });
      addRel({ from: 'b', to: 'a', type: 'follow-up' });

      const chain = getFollowUpChain('a');
      expect(chain).toEqual(['a', 'b']);
    });
  });
});
