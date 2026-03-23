/**
 * Entry Utilities — shared helpers for extracting content from
 * notebook entries. Centralises the 3+ different patterns found
 * across services.
 */
import type { NotebookEntry, LiveEntry } from '@/types/entries';

/** Extract text content from any entry type, or null if not text-bearing. */
export function extractContent(entry: NotebookEntry): string | null {
  if ('content' in entry && typeof entry.content === 'string') {
    return entry.content;
  }
  if (entry.type === 'reading-material') {
    return entry.slides.map((s) => `${s.heading}\n${s.body}`).join('\n\n');
  }
  if (entry.type === 'flashcard-deck') {
    return entry.cards.map((c) => `${c.front}\n${c.back}`).join('\n\n');
  }
  if (entry.type === 'exercise-set') {
    return entry.exercises.map((e) => e.prompt).join('\n\n');
  }
  return null;
}

/** Build a compact context string from recent entries. */
export function recentContext(
  entries: LiveEntry[],
  maxEntries = 6,
  maxChars = 600,
): string {
  return entries.slice(-maxEntries)
    .map((le) => extractContent(le.entry))
    .filter(Boolean)
    .join('\n')
    .slice(0, maxChars);
}

/** Check if an entry is a student-authored block. */
export function isStudentEntry(entry: NotebookEntry): boolean {
  return ['prose', 'scratch', 'hypothesis', 'question', 'sketch'].includes(entry.type);
}

/** Check if an entry is a tutor-authored block. */
export function isTutorEntry(entry: NotebookEntry): boolean {
  return entry.type.startsWith('tutor-') ||
    ['concept-diagram', 'thinker-card', 'silence'].includes(entry.type);
}

/** Check if an entry is a teaching material block. */
export function isTeachingEntry(entry: NotebookEntry): boolean {
  return ['reading-material', 'flashcard-deck', 'exercise-set'].includes(entry.type);
}
