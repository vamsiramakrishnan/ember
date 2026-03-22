/**
 * useEntryInference — infers the entry type from student text.
 * Question (ends with ?), Hypothesis (starts with "I think"),
 * Scratch (short or starts with lowercase), Prose (default).
 */
import type { StudentEntryType, NotebookEntry } from '@/types/entries';

const hypothesisPrefixes = [
  'i think',
  'i believe',
  'maybe',
  'perhaps',
  'my guess',
  'i suspect',
  'what if',
];

export function inferEntryType(text: string): StudentEntryType {
  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();

  if (trimmed.endsWith('?')) return 'question';
  if (hypothesisPrefixes.some((p) => lower.startsWith(p))) return 'hypothesis';
  if (trimmed.length < 80 && /^[a-z]/.test(trimmed)) return 'scratch';

  return 'prose';
}

export function createStudentEntry(text: string): NotebookEntry {
  const entryType = inferEntryType(text);
  return { type: entryType, content: text };
}
