/**
 * Deck Expander — iteratively appends slides to an existing reading deck.
 *
 * Uses a git-diff-inspired approach: given the existing slides, generates
 * a continuation that picks up where the deck left off. The new slides
 * are appended (not replaced), preserving the student's reading position.
 */
import { generateStructured } from './structured-generator';
import { refineContent } from './content-refiner';
import { validateSlides } from './slide-validation';
import { narrateStep, cancelNarration } from './status-narrator';
import { setTutorActivity } from '@/state';
import type { NotebookEntry, LiveEntry, ReadingSlide } from '@/types/entries';

/** How many new slides to generate per expansion. */
const EXPANSION_SIZES: Record<string, number> = {
  brief: 3, standard: 5, deep: 8,
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

          const base = stripTrailingSummary(existing.slides);
          const entry: NotebookEntry = {
            type: 'reading-material',
            title: existing.title, subtitle: existing.subtitle,
            slides: [...base, ...newSlides],
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
    "layout": "content | two-column | quote | diagram | summary | timeline | table | stat-cards | process-flow | pyramid | comparison | funnel | cycle | checklist | matrix",
    "accent": "sage | indigo | amber | margin (optional)",
    "statCards": [{"value": "42%", "label": "Metric", "detail": "context"}],
    "processSteps": [{"step": "Step name", "detail": "description"}],
    "pyramidLayers": [{"label": "Top", "detail": "narrowest concept"}],
    "comparisonData": {"leftLabel": "A", "rightLabel": "B", "leftPoints": ["..."], "rightPoints": ["..."]},
    "funnelStages": [{"stage": "Stage", "value": "100", "detail": "..."}],
    "cycleSteps": [{"step": "Step", "detail": "..."}],
    "checklistItems": [{"item": "Key point", "checked": true}],
    "matrixData": {"topLabel": "High", "bottomLabel": "Low", "leftLabel": "Easy", "rightLabel": "Hard", "quadrants": ["TL","TR","BL","BR"]}
  }]
}

Rules:
- At least 1 slide MUST use a visual layout (not content/quote)
- PRIORITISE visual layouts: stat-cards, process-flow, pyramid, funnel, cycle, matrix
- Each visual layout MUST include its corresponding data array
- Write MORE content per slide than the original (deeper, more detailed)
- Introduce new angles, examples, or connections not in the existing slides
- Last slide: layout "summary" — synthesize the entire expanded deck
- Accents: sage=mastery, indigo=inquiry, amber=synthesis, margin=tutor`;
}
