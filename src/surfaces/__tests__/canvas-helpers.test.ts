import { describe, test, expect } from 'vitest';
import { cardAccent, cardContent } from '../canvas-helpers';
import type { LiveEntry } from '@/types/entries';

function makeLiveEntry(entry: Record<string, unknown>, id = 'e1'): LiveEntry {
  return {
    id,
    entry: entry as LiveEntry['entry'],
    crossedOut: false,
    bookmarked: false,
    pinned: false,
    annotations: [],
    timestamp: Date.now(),
  };
}

describe('canvas-helpers', () => {
  describe('cardAccent', () => {
    test('returns sage for prose', () => {
      expect(cardAccent('prose')).toBe('sage');
    });

    test('returns sage for scratch', () => {
      expect(cardAccent('scratch')).toBe('sage');
    });

    test('returns amber for question', () => {
      expect(cardAccent('question')).toBe('amber');
    });

    test('returns margin for tutor-marginalia', () => {
      expect(cardAccent('tutor-marginalia')).toBe('margin');
    });

    test('returns indigo for tutor-connection', () => {
      expect(cardAccent('tutor-connection')).toBe('indigo');
    });

    test('returns indigo for concept-diagram', () => {
      expect(cardAccent('concept-diagram')).toBe('indigo');
    });

    test('returns empty string for unknown type', () => {
      expect(cardAccent('silence')).toBe('');
    });
  });

  describe('cardContent', () => {
    test('extracts content from prose entry', () => {
      const le = makeLiveEntry({ type: 'prose', content: 'Hello world' });
      expect(cardContent(le)).toEqual({ label: 'Thought', body: 'Hello world' });
    });

    test('extracts content from question entry', () => {
      const le = makeLiveEntry({ type: 'question', content: 'Why?' });
      expect(cardContent(le)).toEqual({ label: 'Question', body: 'Why?' });
    });

    test('extracts content from tutor-marginalia', () => {
      const le = makeLiveEntry({ type: 'tutor-marginalia', content: 'Good point' });
      expect(cardContent(le)).toEqual({ label: 'Tutor', body: 'Good point' });
    });

    test('truncates long content', () => {
      const long = 'a'.repeat(200);
      const le = makeLiveEntry({ type: 'prose', content: long });
      const result = cardContent(le);
      expect(result?.body.length).toBeLessThanOrEqual(101);
      expect(result?.body.endsWith('…')).toBe(true);
    });

    test('extracts thinker name and gift', () => {
      const le = makeLiveEntry({
        type: 'thinker-card',
        thinker: { name: 'Kepler', gift: 'Harmony', dates: '1571–1630', bridge: 'orbits' },
      });
      expect(cardContent(le)).toEqual({ label: 'Kepler', body: 'Harmony' });
    });

    test('returns null for silence entries', () => {
      const le = makeLiveEntry({ type: 'silence' });
      expect(cardContent(le)).toBeNull();
    });

    test('returns null for divider entries', () => {
      const le = makeLiveEntry({ type: 'divider' });
      expect(cardContent(le)).toBeNull();
    });

    test('handles concept-diagram', () => {
      const le = makeLiveEntry({
        type: 'concept-diagram',
        title: 'My Map',
        items: [{ label: 'A' }, { label: 'B' }],
      });
      expect(cardContent(le)).toEqual({ label: 'My Map', body: 'A → B' });
    });
  });
});
