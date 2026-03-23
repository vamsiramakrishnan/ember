/**
 * canvas-helpers — pure utility functions for NotebookCanvas.
 * Extracts card content derivation from entry types.
 */
import type { LiveEntry } from '@/types/entries';

function trunc(s: string, max = 100): string {
  return s.length > max ? s.slice(0, max) + '…' : s;
}

/** Extract a label and body from any entry type. */
export function cardContent(e: LiveEntry): { label: string; body: string } | null {
  const entry = e.entry;
  switch (entry.type) {
    case 'prose': return { label: 'Thought', body: trunc(entry.content) };
    case 'scratch': return { label: 'Note', body: trunc(entry.content) };
    case 'hypothesis': return { label: 'Hypothesis', body: trunc(entry.content) };
    case 'question': return { label: 'Question', body: trunc(entry.content) };
    case 'tutor-marginalia': return { label: 'Tutor', body: trunc(entry.content) };
    case 'tutor-question': return { label: 'Probe', body: trunc(entry.content) };
    case 'tutor-connection': return { label: 'Connection', body: trunc(entry.content) };
    case 'tutor-reflection': return { label: 'Reflection', body: trunc(entry.content) };
    case 'tutor-directive': return { label: 'Explore', body: trunc(entry.content) };
    case 'bridge-suggestion': return { label: 'Bridge', body: trunc(entry.content) };
    case 'thinker-card': return { label: entry.thinker.name, body: entry.thinker.gift };
    case 'concept-diagram': return { label: entry.title ?? 'Concept Map', body: entry.items.map((i) => i.label).join(' → ') };
    default: return null;
  }
}
