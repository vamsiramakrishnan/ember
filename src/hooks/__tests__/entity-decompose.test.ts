/**
 * Tests for entity-decompose — decomposeEntries function.
 */
import { describe, it, expect } from 'vitest';
import { decomposeEntries } from '../entity-decompose';
import type { LiveEntry } from '@/types/entries';

function makeLive(id: string, entry: Record<string, unknown>): LiveEntry {
  return {
    id,
    entry: entry as LiveEntry['entry'],
    crossedOut: false,
    bookmarked: false,
    pinned: false,
    timestamp: Date.now(),
  };
}

describe('decomposeEntries', () => {
  it('extracts prose entries', () => {
    const entries = [makeLive('e1', { type: 'prose', content: 'My thoughts on gravity' })];
    const result = decomposeEntries(entries, 'nb1');
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: 'e1', type: 'entry', notebookId: 'nb1', detail: 'student note', meta: 'prose',
    });
  });

  it('extracts hypothesis entries', () => {
    const entries = [makeLive('e2', { type: 'hypothesis', content: 'I think F=ma' })];
    const result = decomposeEntries(entries, 'nb1');
    expect(result[0]).toMatchObject({ type: 'entry', detail: 'student hypothesis', meta: 'hypothesis' });
  });

  it('extracts question entries', () => {
    const entries = [makeLive('e3', { type: 'question', content: 'What is mass?' })];
    const result = decomposeEntries(entries, 'nb1');
    expect(result[0]).toMatchObject({ type: 'entry', detail: 'student question', meta: 'question' });
  });

  it('extracts tutor notes', () => {
    const entries = [
      makeLive('t1', { type: 'tutor-marginalia', content: 'Good insight' }),
      makeLive('t2', { type: 'tutor-question', content: 'Why do you think so?' }),
      makeLive('t3', { type: 'tutor-connection', content: 'This relates to Kepler' }),
    ];
    const result = decomposeEntries(entries, 'nb1');
    expect(result).toHaveLength(3);
    expect(result[0]!.type).toBe('tutor-note');
    expect(result[1]!.type).toBe('tutor-note');
    expect(result[2]!.type).toBe('tutor-note');
  });

  it('extracts thinker cards', () => {
    const entries = [makeLive('tk1', {
      type: 'thinker-card',
      thinker: { name: 'Kepler', dates: '1571-1630', gift: 'Harmony', bridge: 'Music' },
    })];
    const result = decomposeEntries(entries, 'nb1');
    expect(result[0]).toMatchObject({ name: 'Kepler', detail: 'Harmony' });
  });

  it('extracts code cells', () => {
    const entries = [makeLive('c1', { type: 'code-cell', language: 'python', source: 'print("hi")\nmore' })];
    const result = decomposeEntries(entries, 'nb1');
    expect(result[0]).toMatchObject({ type: 'code', detail: 'python' });
  });

  it('extracts reading-material with slides', () => {
    const entries = [makeLive('rm1', {
      type: 'reading-material',
      title: 'Gravity 101',
      slides: [
        { heading: 'Intro', body: 'Start here' },
        { heading: 'Deep dive', body: 'More detail' },
      ],
    })];
    const result = decomposeEntries(entries, 'nb1');
    // 1 entry + 2 slides
    expect(result).toHaveLength(3);
    expect(result[1]!.type).toBe('slide');
    expect(result[1]!.parentId).toBe('rm1');
  });

  it('extracts flashcard decks with cards', () => {
    const entries = [makeLive('fd1', {
      type: 'flashcard-deck',
      title: 'Physics Cards',
      cards: [{ front: 'What is F=ma?', back: 'Newton 2nd', concept: 'mechanics' }],
    })];
    const result = decomposeEntries(entries, 'nb1');
    expect(result).toHaveLength(2);
    expect(result[1]!.type).toBe('card');
  });

  it('returns empty for empty input', () => {
    expect(decomposeEntries([], 'nb1')).toEqual([]);
  });

  it('truncates long content in name field', () => {
    const longContent = 'x'.repeat(100);
    const entries = [makeLive('e1', { type: 'prose', content: longContent })];
    const result = decomposeEntries(entries, 'nb1');
    expect(result[0]!.name.length).toBeLessThanOrEqual(60);
  });
});
