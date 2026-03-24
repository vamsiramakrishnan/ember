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

const STYLE = 'The drawing medium is fountain pen on aged ivory paper. All shading is built through careful cross-hatching — parallel lines at varying densities, never solid fills or smooth gradients. The ink is warm dark brown, not pure black. Accent colours (muted sage green, quiet indigo, warm amber) appear only where meaning demands them, applied as thin washes, never bold. No digital effects, no drop shadows, no glow, no neon, no flat vector art. The mood is the quiet warmth of a late-afternoon library. Match the exact colours shown in the style reference palette image.';

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
  `You rewrite illustration prompts for Gemini image generation.

Given a student's /draw request and their recent notebook context, produce a single
concrete illustration prompt as a narrative descriptive paragraph. You MUST:
- Resolve @mentions (e.g. @[Kepler](thinker:kepler-1) → "Kepler") into plain names
- Resolve vague references ("this", "that", "the concept above") using the context
- Write a descriptive scene: what to depict, the composition, the mood, the medium
- Use narrative prose, NOT a list of keywords — describe the image as a coherent scene
- Do NOT ask for any text or letters in the image
- Keep it under 3 sentences

Output ONLY the rewritten prompt paragraph. No preamble, no markdown.`,
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
    return `A concept illustration showing ${rawQuery}, drawn in fountain pen on warm ivory paper. The composition should clearly depict the core idea with confident, evocative pen work — the kind of explanatory diagram a thoughtful professor draws on a chalkboard margin during a lecture, where every line serves a purpose. Use clean geometric shapes for distinct concepts, connected by thin arrows or flowing lines that show relationships. Build depth through selective cross-hatching, leaving generous paper visible between marks. Do not include any text, labels, letters, or words in the image. ${STYLE}`;
  }

  // Fast path: specific query with context — just template it in
  if (!needsResolution(rawQuery) && context) {
    return `A concept illustration showing ${rawQuery}, drawn in fountain pen on warm ivory paper. This illustration draws from the student's recent exploration — ground the visual in the specific concepts and relationships they have been working with. The composition should clearly depict the core idea with confident pen work: clean shapes for concepts, thin arrows or flowing lines for relationships, cross-hatching for depth. Leave generous paper visible between marks. Do not include any text, labels, letters, or words in the image. ${STYLE}\n\nContext from the student's recent notebook:\n${context}`;
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
  return `A concept illustration showing ${cleaned}, drawn in fountain pen on warm ivory paper. The composition should clearly depict the core idea with confident, evocative pen work — clean shapes connected by thin arrows or flowing lines. Build depth through selective cross-hatching, leaving generous paper visible. Do not include any text, labels, letters, or words in the image. ${STYLE}`;
}
