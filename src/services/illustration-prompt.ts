/**
 * Illustration prompt builder — resolves context, @mentions, and vague
 * references into concrete image-generation prompts.
 *
 * Three paths:
 * 1. Specific query, no context → direct template (zero latency)
 * 2. Specific query + context → template with context appended
 * 3. Vague references / @mentions → Flash Lite resolves from context
 */
import { micro } from './agents/config';
import { askAgent } from './run-agent';
import type { LiveEntry } from '@/types/entries';

const STYLE = 'Style: warm sepia paper, fountain pen ink, minimal colour.';

/** Does the query contain vague references or @mentions that need resolution? */
function needsResolution(query: string): boolean {
  if (/@\[/.test(query)) return true;
  const vague = /\b(this|that|these|those|it|the above|the concept|the idea)\b/i;
  return vague.test(query);
}

/** Extract session context string from recent entries. */
export function extractContext(entries: LiveEntry[]): string {
  return entries.slice(-6)
    .map((le) => 'content' in le.entry ? le.entry.content : '')
    .filter(Boolean)
    .join('\n')
    .slice(0, 600);
}

const PROMPT_REWRITER = micro(
  `You rewrite illustration prompts for a hand-drawn notebook sketcher.

Given a student's /draw request and their recent notebook context, produce a single
concrete illustration prompt. You MUST:
- Resolve @mentions (e.g. @[Kepler](thinker:kepler-1) → "Kepler") into plain names
- Resolve vague references ("this", "that", "the concept above") using the context
- Describe what the sketch should depict: subjects, relationships, labels, layout
- Keep it under 3 sentences

Output ONLY the rewritten prompt. No preamble, no markdown.`,
);

/**
 * Build the image-generation prompt.
 * @param rawQuery  — the user's text after /draw
 * @param entries   — recent session entries (standalone path)
 * @param dagContext — pre-built context string (DAG path)
 */
export async function buildIllustrationPrompt(
  rawQuery: string,
  entries: LiveEntry[],
  dagContext?: string,
): Promise<string> {
  const context = dagContext || extractContext(entries);

  // Fast path: specific query, no resolution needed, no context
  if (!needsResolution(rawQuery) && !context) {
    return `Draw a hand-sketched concept illustration for: ${rawQuery}. ${STYLE}`;
  }

  // Fast path: specific query with context — just template it in
  if (!needsResolution(rawQuery) && context) {
    return [
      `Draw a hand-sketched concept illustration for: ${rawQuery}. ${STYLE}`,
      '',
      'Context from the student\'s recent notebook:',
      context,
    ].join('\n');
  }

  // Slow path: vague references or @mentions — Flash Lite resolves
  if (context) {
    try {
      const resolved = await askAgent(PROMPT_REWRITER, [
        `Recent notebook:\n${context}`,
        `\nStudent's request: /draw ${rawQuery}`,
      ].join(''));
      const trimmed = resolved.trim();
      if (trimmed) return `${trimmed} ${STYLE}`;
    } catch {
      // Fall through to static prompt
    }
  }

  // Fallback: strip @mention syntax and use raw query
  const cleaned = rawQuery.replace(/@\[([^\]]+)\]\([^)]*\)/g, '$1');
  return `Draw a hand-sketched concept illustration for: ${cleaned}. ${STYLE}`;
}
