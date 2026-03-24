/**
 * Tests for entry-utils.ts — helpers for extracting content from notebook entries.
 */
import { describe, it, expect } from 'vitest';
import {
  extractContent,
  recentContext,
  isStudentEntry,
  isTutorEntry,
  isTeachingEntry,
} from '../entry-utils';
import type { NotebookEntry, LiveEntry } from '@/types/entries';

function makeLive(entry: NotebookEntry, id = 'e1'): LiveEntry {
  return { id, entry, crossedOut: false, bookmarked: false, pinned: false, timestamp: Date.now() };
}

describe('extractContent', () => {
  it('extracts content from prose entry', () => {
    expect(extractContent({ type: 'prose', content: 'Hello' })).toBe('Hello');
  });

  it('extracts content from tutor-marginalia', () => {
    expect(extractContent({ type: 'tutor-marginalia', content: 'Note' })).toBe('Note');
  });

  it('extracts content from reading-material', () => {
    const entry: NotebookEntry = {
      type: 'reading-material',
      title: 'Test',
      slides: [
        { heading: 'H1', body: 'B1', layout: 'content' },
        { heading: 'H2', body: 'B2', layout: 'content' },
      ],
    };
    const result = extractContent(entry);
    expect(result).toContain('H1');
    expect(result).toContain('B1');
    expect(result).toContain('H2');
  });

  it('extracts content from flashcard-deck', () => {
    const entry: NotebookEntry = {
      type: 'flashcard-deck',
      title: 'Cards',
      cards: [{ front: 'Q1', back: 'A1' }, { front: 'Q2', back: 'A2' }],
    };
    const result = extractContent(entry);
    expect(result).toContain('Q1');
    expect(result).toContain('A1');
  });

  it('extracts content from exercise-set', () => {
    const entry: NotebookEntry = {
      type: 'exercise-set',
      title: 'Ex',
      difficulty: 'foundational',
      exercises: [
        { prompt: 'P1', approach: 'A1', format: 'open-response' },
        { prompt: 'P2', approach: 'A2', format: 'explain' },
      ],
    };
    const result = extractContent(entry);
    expect(result).toContain('P1');
    expect(result).toContain('P2');
  });

  it('returns null for non-text entries', () => {
    expect(extractContent({ type: 'silence' })).toBeNull();
    expect(extractContent({ type: 'divider' })).toBeNull();
    expect(extractContent({ type: 'sketch', dataUrl: 'data:...' })).toBeNull();
  });
});

describe('recentContext', () => {
  it('builds context from recent entries', () => {
    const entries: LiveEntry[] = [
      makeLive({ type: 'prose', content: 'First' }, 'e1'),
      makeLive({ type: 'tutor-marginalia', content: 'Second' }, 'e2'),
      makeLive({ type: 'prose', content: 'Third' }, 'e3'),
    ];
    const result = recentContext(entries);
    expect(result).toContain('First');
    expect(result).toContain('Second');
    expect(result).toContain('Third');
  });

  it('limits to maxEntries', () => {
    const entries: LiveEntry[] = Array.from({ length: 10 }, (_, i) =>
      makeLive({ type: 'prose', content: `Entry${i}` }, `e${i}`),
    );
    const result = recentContext(entries, 2);
    expect(result).not.toContain('Entry0');
    expect(result).toContain('Entry8');
    expect(result).toContain('Entry9');
  });

  it('truncates to maxChars', () => {
    const entries: LiveEntry[] = [
      makeLive({ type: 'prose', content: 'A'.repeat(500) }, 'e1'),
      makeLive({ type: 'prose', content: 'B'.repeat(500) }, 'e2'),
    ];
    const result = recentContext(entries, 6, 100);
    expect(result.length).toBeLessThanOrEqual(100);
  });

  it('skips non-text entries', () => {
    const entries: LiveEntry[] = [
      makeLive({ type: 'silence' }, 'e1'),
      makeLive({ type: 'prose', content: 'Visible' }, 'e2'),
    ];
    const result = recentContext(entries);
    expect(result).toBe('Visible');
  });
});

describe('isStudentEntry', () => {
  it('identifies student entries', () => {
    expect(isStudentEntry({ type: 'prose', content: '' })).toBe(true);
    expect(isStudentEntry({ type: 'scratch', content: '' })).toBe(true);
    expect(isStudentEntry({ type: 'hypothesis', content: '' })).toBe(true);
    expect(isStudentEntry({ type: 'question', content: '' })).toBe(true);
    expect(isStudentEntry({ type: 'sketch', dataUrl: '' })).toBe(true);
  });

  it('rejects non-student entries', () => {
    expect(isStudentEntry({ type: 'tutor-marginalia', content: '' })).toBe(false);
    expect(isStudentEntry({ type: 'silence' })).toBe(false);
  });
});

describe('isTutorEntry', () => {
  it('identifies tutor entries', () => {
    expect(isTutorEntry({ type: 'tutor-marginalia', content: '' })).toBe(true);
    expect(isTutorEntry({ type: 'tutor-question', content: '' })).toBe(true);
    expect(isTutorEntry({ type: 'concept-diagram', items: [] })).toBe(true);
    expect(isTutorEntry({ type: 'silence' })).toBe(true);
  });

  it('rejects non-tutor entries', () => {
    expect(isTutorEntry({ type: 'prose', content: '' })).toBe(false);
  });
});

describe('isTeachingEntry', () => {
  it('identifies teaching entries', () => {
    expect(isTeachingEntry({ type: 'reading-material', title: '', slides: [] })).toBe(true);
    expect(isTeachingEntry({
      type: 'flashcard-deck', title: '', cards: [],
    })).toBe(true);
    expect(isTeachingEntry({
      type: 'exercise-set', title: '', exercises: [], difficulty: 'foundational',
    })).toBe(true);
  });

  it('rejects non-teaching entries', () => {
    expect(isTeachingEntry({ type: 'prose', content: '' })).toBe(false);
  });
});
