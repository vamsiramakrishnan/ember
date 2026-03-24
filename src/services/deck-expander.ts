/**
 * Deck Expander — iteratively appends slides to an existing reading deck.
 *
 * Uses a git-diff-inspired approach: given the existing slides, generates
 * a continuation that picks up where the deck left off. The new slides
 * are appended (not replaced), preserving the student's reading position.
 *
 * Also enriches slides with per-slide AI illustrations for visual-heavy
 * layouts (diagram, timeline, two-column).
 */
import { generateStructured } from './structured-generator';
import { refineContent } from './content-refiner';
import { narrateStep, cancelNarration } from './status-narrator';
import { setTutorActivity } from '@/state';
import type { NotebookEntry, LiveEntry, ReadingSlide } from '@/types/entries';

const VALID_LAYOUTS = new Set([
  'title', 'content', 'two-column', 'quote', 'diagram', 'summary', 'timeline', 'table',
]);
const VALID_ACCENTS = new Set(['sage', 'indigo', 'amber', 'margin']);

/** How many new slides to generate per expansion. */
const EXPANSION_SIZES: Record<string, number> = {
  brief: 3,
  standard: 5,
  deep: 8,
};

export type ExpansionDepth = 'brief' | 'standard' | 'deep';

/**
 * Generate additional slides that continue from the existing deck.
 * Returns the full updated entry with old + new slides merged.
 */
export async function expandDeck(
  existing: { title: string; subtitle?: string; slides: ReadingSlide[]; coverUrl?: string },
  topic: string,
  depth: ExpansionDepth = 'standard',
  entries: LiveEntry[] = [],
): Promise<NotebookEntry | null> {
  const count = EXPANSION_SIZES[depth] ?? 5;
  const existingSummary = existing.slides
    .map((s, i) => `${i + 1}. [${s.layout}] ${s.heading}`)
    .join('\n');

  setTutorActivity(true, false, { step: 'enriching', label: 'expanding deck\u2026' });
  narrateStep('enriching', topic);

  try {
    const raw = await generateStructured<{ slides: ReadingSlide[] }>(
      topic, entries, {
        systemPrompt: buildExpandPrompt(count, existingSummary, existing.title),
        validate: (parsed) => {
          if (!Array.isArray(parsed.slides) || parsed.slides.length === 0) return null;
          const newSlides = validateSlides(parsed.slides);
          if (newSlides.length === 0) return null;

          // Merge: existing slides (without final summary) + new slides
          const base = stripTrailingSummary(existing.slides);
          const merged = [...base, ...newSlides];

          const entry: NotebookEntry = {
            type: 'reading-material',
            title: existing.title,
            subtitle: existing.subtitle,
            slides: merged,
            coverUrl: existing.coverUrl,
          };
          return entry;
        },
      },
    );

    if (!raw) return null;
    const { entry: refined } = await refineContent(raw, topic);
    return refined;
  } finally {
    cancelNarration();
    setTutorActivity(false, false, null);
  }
}

// ─── Helpers ─────────────────────────────────────────────────

function validateSlides(raw: ReadingSlide[]): ReadingSlide[] {
  return raw.slice(0, 12).map((s) => ({
    heading: String(s.heading || 'Untitled'),
    body: String(s.body || ''),
    layout: VALID_LAYOUTS.has(s.layout) ? s.layout : 'content',
    accent: s.accent && VALID_ACCENTS.has(s.accent) ? s.accent : undefined,
    notes: s.notes ? String(s.notes) : undefined,
    timeline: Array.isArray(s.timeline) ? s.timeline.map((t) => ({
      period: String(t.period ?? ''), event: String(t.event ?? ''),
      detail: t.detail ? String(t.detail) : undefined,
    })) : undefined,
    tableData: s.tableData?.headers ? {
      headers: s.tableData.headers.map(String),
      rows: (s.tableData.rows ?? []).map((r: string[]) => r.map(String)),
    } : undefined,
    diagramItems: Array.isArray(s.diagramItems) ? s.diagramItems.map((d) => ({
      label: String(d.label ?? ''), detail: d.detail ? String(d.detail) : undefined,
    })) : undefined,
  }));
}

function stripTrailingSummary(slides: ReadingSlide[]): ReadingSlide[] {
  if (slides.length > 0 && slides[slides.length - 1]?.layout === 'summary') {
    return slides.slice(0, -1);
  }
  return slides;
}

function buildExpandPrompt(count: number, existing: string, title: string): string {
  return `You are Ember's tutor expanding a reading material deck titled "${title}".
Output ONLY valid JSON — no markdown fences, no explanation.

The existing deck has these slides:
${existing}

Generate ${count} NEW continuation slides that go DEEPER into the topic.
Do NOT repeat existing slides. Pick up where the deck left off.
End with a "summary" slide that ties together both old and new content.

Schema:
{
  "slides": [{
    "heading": "string",
    "body": "string (markdown — substantial, 80-150 words per slide)",
    "layout": "content | two-column | quote | diagram | summary | timeline | table",
    "accent": "sage | indigo | amber | margin (optional)",
    "notes": "string (optional)",
    "timeline": [{"period": "1609", "event": "...", "detail": "optional"}],
    "tableData": {"headers": ["A", "B"], "rows": [["x", "y"]]},
    "diagramItems": [{"label": "Concept", "detail": "explanation"}]
  }]
}

Rules:
- At least 1 slide MUST use timeline, table, or diagram layout
- Write MORE content per slide than the original (deeper, more detailed)
- Introduce new angles, examples, or connections not in the existing slides
- Last slide: layout "summary" — synthesize the entire expanded deck
- Accents: sage=mastery, indigo=inquiry, amber=synthesis, margin=tutor`;
}
