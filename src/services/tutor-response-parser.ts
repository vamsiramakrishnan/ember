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
    if (type === 'tutor-directive' && typeof parsed.content === 'string') {
      return {
        type: 'tutor-directive',
        content: parsed.content,
        action: typeof parsed.action === 'string' ? parsed.action : undefined,
      };
    }
    if (type === 'concept-diagram' && Array.isArray(parsed.items)) {
      return {
        type: 'concept-diagram',
        items: parseDiagramNodes(parsed.items as Record<string, unknown>[]),
        edges: Array.isArray(parsed.edges)
          ? parseDiagramEdges(parsed.edges as Record<string, unknown>[])
          : undefined,
        title: typeof parsed.title === 'string' ? parsed.title : undefined,
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

/** Recursively parse DiagramNode items, including children. */
function parseDiagramNodes(
  items: Record<string, unknown>[],
): import('@/types/entries').DiagramNode[] {
  return items.map((item) => {
    const node: import('@/types/entries').DiagramNode = {
      label: String(item.label ?? ''),
      subLabel: item.subLabel ? String(item.subLabel) : undefined,
      entityId: item.entityId ? String(item.entityId) : undefined,
      entityKind: validEntityKind(item.entityKind),
      accent: validAccent(item.accent),
      detail: typeof item.detail === 'string' ? item.detail : undefined,
    };

    // Mastery data
    if (isObject(item.mastery)) {
      const m = item.mastery as Record<string, unknown>;
      node.mastery = {
        level: String(m.level ?? ''),
        percentage: typeof m.percentage === 'number' ? m.percentage : 0,
      };
    }

    // Recursive children
    if (Array.isArray(item.children) && item.children.length > 0) {
      node.children = parseDiagramNodes(
        item.children as Record<string, unknown>[],
      );
    }

    return node;
  });
}

/** Parse edge definitions. */
function parseDiagramEdges(
  edges: Record<string, unknown>[],
): import('@/types/entries').DiagramEdge[] {
  return edges
    .filter((e) => typeof e.from === 'number' && typeof e.to === 'number')
    .map((e) => ({
      from: e.from as number,
      to: e.to as number,
      label: typeof e.label === 'string' ? e.label : undefined,
      type: validEdgeType(e.type),
      weight: typeof e.weight === 'number' ? e.weight : undefined,
    }));
}

const ENTITY_KINDS = new Set(['concept', 'thinker', 'term', 'question']);
function validEntityKind(v: unknown): 'concept' | 'thinker' | 'term' | 'question' | undefined {
  return typeof v === 'string' && ENTITY_KINDS.has(v)
    ? v as 'concept' | 'thinker' | 'term' | 'question'
    : undefined;
}

const ACCENTS = new Set(['sage', 'indigo', 'amber', 'margin']);
function validAccent(v: unknown): 'sage' | 'indigo' | 'amber' | 'margin' | undefined {
  return typeof v === 'string' && ACCENTS.has(v)
    ? v as 'sage' | 'indigo' | 'amber' | 'margin'
    : undefined;
}

const EDGE_TYPES = new Set(['causes', 'enables', 'contrasts', 'extends', 'requires', 'bridges']);
function validEdgeType(v: unknown): 'causes' | 'enables' | 'contrasts' | 'extends' | 'requires' | 'bridges' | undefined {
  return typeof v === 'string' && EDGE_TYPES.has(v)
    ? v as 'causes' | 'enables' | 'contrasts' | 'extends' | 'requires' | 'bridges'
    : undefined;
}
