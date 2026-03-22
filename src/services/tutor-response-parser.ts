/**
 * Tutor Response Parser — parses Gemini JSON responses into
 * typed NotebookEntry objects. Shared by orchestrator and
 * any service that calls the tutor agent.
 */
import type { NotebookEntry } from '@/types/entries';

/**
 * Parse the tutor's JSON response into a NotebookEntry.
 * Handles markdown fences, fallback to raw text, and all
 * tutor response types.
 */
export function parseTutorResponse(raw: string): NotebookEntry | null {
  try {
    const cleaned = raw
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .trim();
    const parsed = JSON.parse(cleaned) as Record<string, unknown>;
    const type = parsed.type as string;

    if (type === 'tutor-marginalia' && typeof parsed.content === 'string') {
      return { type: 'tutor-marginalia', content: parsed.content };
    }
    if (type === 'tutor-question' && typeof parsed.content === 'string') {
      return { type: 'tutor-question', content: parsed.content };
    }
    if (type === 'tutor-connection' && typeof parsed.content === 'string') {
      return {
        type: 'tutor-connection',
        content: parsed.content,
        emphasisEnd: typeof parsed.emphasisEnd === 'number'
          ? parsed.emphasisEnd : 0,
      };
    }
    if (type === 'thinker-card' && isObject(parsed.thinker)) {
      const t = parsed.thinker as Record<string, unknown>;
      return {
        type: 'thinker-card',
        thinker: {
          name: String(t.name ?? ''),
          dates: String(t.dates ?? ''),
          gift: String(t.gift ?? ''),
          bridge: String(t.bridge ?? ''),
        },
      };
    }
    if (type === 'concept-diagram' && Array.isArray(parsed.items)) {
      return {
        type: 'concept-diagram',
        items: (parsed.items as Record<string, unknown>[]).map((item) => ({
          label: String(item.label ?? ''),
          subLabel: item.subLabel ? String(item.subLabel) : undefined,
        })),
      };
    }
    // Fallback: if it has content, treat as marginalia
    if (typeof parsed.content === 'string') {
      return { type: 'tutor-marginalia', content: parsed.content };
    }
    return null;
  } catch {
    // Not JSON — treat raw text as marginalia
    return raw.trim()
      ? { type: 'tutor-marginalia', content: raw.trim() }
      : null;
  }
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}
