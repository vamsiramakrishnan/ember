/**
 * Spatial Context — collects the notebook entries above and below
 * the student's input position to give the DAG parser awareness of
 * implicit references.
 *
 * When a student writes "help me research this" — what is "this"?
 * It's whatever they were reading/writing before. The spatial context
 * captures the 3-4 entries above and the pinned threads to resolve
 * anaphoric references ("this", "that", "the concept above", etc.).
 *
 * This replaces the need for every reference to be an explicit @mention.
 * The LLM receives spatial context and can resolve implicit references.
 */
import type { LiveEntry, NotebookEntry } from '@/types/entries';

export interface SpatialContext {
  /** Entries immediately above the input (most recent first, max 4). */
  above: SpatialEntry[];
  /** Pinned threads visible at the top. */
  pinned: SpatialEntry[];
  /** The session topic (if set). */
  sessionTopic: string | null;
  /** A compact text representation for the LLM prompt. */
  prompt: string;
}

export interface SpatialEntry {
  id: string;
  type: string;
  content: string;
  /** Whether this is a tutor or student entry. */
  author: 'student' | 'tutor' | 'system';
}

const TUTOR_TYPES = new Set([
  'tutor-marginalia', 'tutor-question', 'tutor-connection',
  'tutor-reflection', 'tutor-directive', 'streaming-text',
]);

const SYSTEM_TYPES = new Set([
  'silence', 'divider', 'echo', 'bridge-suggestion', 'citation',
]);

function entryAuthor(type: string): SpatialEntry['author'] {
  if (TUTOR_TYPES.has(type)) return 'tutor';
  if (SYSTEM_TYPES.has(type)) return 'system';
  return 'student';
}

function extractContent(entry: NotebookEntry): string {
  if ('content' in entry && typeof entry.content === 'string') return entry.content;
  if (entry.type === 'concept-diagram') return entry.title ?? 'concept diagram';
  if (entry.type === 'thinker-card') return `${entry.thinker.name}: ${entry.thinker.gift}`;
  return `[${entry.type}]`;
}

/**
 * Build spatial context from the current notebook state.
 * @param entries — all entries in the current session
 * @param pinnedEntries — pinned threads at the top
 * @param sessionTopic — the current session's topic
 */
export function buildSpatialContext(
  entries: LiveEntry[],
  pinnedEntries: LiveEntry[],
  sessionTopic: string | null,
): SpatialContext {
  // Take the last 4 non-system entries above the input
  const above: SpatialEntry[] = entries
    .slice(-6)
    .filter((le) => !SYSTEM_TYPES.has(le.entry.type))
    .slice(-4)
    .reverse()
    .map((le) => ({
      id: le.id,
      type: le.entry.type,
      content: extractContent(le.entry).slice(0, 200),
      author: entryAuthor(le.entry.type),
    }));

  const pinned: SpatialEntry[] = pinnedEntries.map((le) => ({
    id: le.id,
    type: le.entry.type,
    content: extractContent(le.entry).slice(0, 150),
    author: 'student',
  }));

  // Build compact text for the LLM
  const lines: string[] = [];
  if (sessionTopic) lines.push(`Session topic: ${sessionTopic}`);
  if (pinned.length > 0) {
    lines.push('Pinned threads:');
    for (const p of pinned) lines.push(`  - ${p.content}`);
  }
  if (above.length > 0) {
    lines.push('Recent entries (most recent first):');
    for (const a of above) {
      const prefix = a.author === 'tutor' ? '[tutor]' : a.author === 'student' ? '[student]' : '[system]';
      lines.push(`  ${prefix} ${a.content}`);
    }
  }

  return {
    above,
    pinned,
    sessionTopic,
    prompt: lines.join('\n'),
  };
}
