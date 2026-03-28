/**
 * Reading Material Generation — produces structured slide decks
 * with rich visual layouts (timelines, tables, diagrams, stat cards,
 * process flows, pyramids, funnels, cycles, matrices, checklists).
 * Uses the shared structured-generator pipeline.
 */
import { generateStructured } from './structured-generator';
import { refineContent } from './content-refiner';
import { generateCoverArt } from './visual-generation';
import { validateSlides } from './slide-validation';
import type { NotebookEntry, LiveEntry, ReadingSlide } from '@/types/entries';

interface RawDeck {
  title: string;
  subtitle?: string;
  slides: ReadingSlide[];
}

export async function generateReadingMaterial(
  topic: string,
  entries: LiveEntry[],
  enrichedContext?: string,
): Promise<NotebookEntry | null> {
  const raw = await generateStructured<RawDeck>(topic, entries, {
    systemPrompt: SYSTEM_PROMPT,
    validate: (parsed) => {
      if (!parsed.title || !Array.isArray(parsed.slides) || parsed.slides.length === 0) {
        return null;
      }
      const slides = validateSlides(parsed.slides);
      const entry: NotebookEntry = {
        type: 'reading-material',
        title: String(parsed.title),
        subtitle: parsed.subtitle ? String(parsed.subtitle) : undefined,
        slides,
      };
      generateCoverArt(String(parsed.title), topic, 'book').then((url) => {
        if (url && entry.type === 'reading-material') {
          (entry as { coverUrl?: string }).coverUrl = url;
        }
      }).catch(() => {});
      return entry;
    },
  }, enrichedContext);
  if (!raw) return null;
  const { entry: refined } = await refineContent(raw, topic, enrichedContext);
  return refined;
}

const SYSTEM_PROMPT = `You are Ember's tutor creating a visually rich reading material deck.
Output ONLY valid JSON — no markdown fences, no explanation.

Schema:
{
  "title": "string", "subtitle": "string (optional)",
  "slides": [{
    "heading": "string",
    "body": "string (markdown — always include for all layouts)",
    "layout": "title | content | two-column | quote | diagram | summary | timeline | table | stat-cards | process-flow | pyramid | comparison | funnel | cycle | checklist | matrix",
    "accent": "sage | indigo | amber | margin (optional)",
    "notes": "string (optional tutor notes)",
    "timeline": [{"period": "1609", "event": "...", "detail": "optional"}],
    "tableData": {"headers": ["A","B"], "rows": [["x","y"]]},
    "diagramItems": [{"label": "Concept", "detail": "explanation"}],
    "statCards": [{"value": "42%", "label": "Success Rate", "detail": "optional context"}],
    "processSteps": [{"step": "Observe", "detail": "Gather raw data"}],
    "pyramidLayers": [{"label": "Top (narrowest)", "detail": "..."}],
    "comparisonData": {"leftLabel": "Classical", "rightLabel": "Quantum", "leftPoints": ["..."], "rightPoints": ["..."]},
    "funnelStages": [{"stage": "Awareness", "value": "1000", "detail": "..."}],
    "cycleSteps": [{"step": "Plan", "detail": "..."}],
    "checklistItems": [{"item": "Key insight", "checked": true}],
    "matrixData": {"topLabel": "High", "bottomLabel": "Low", "leftLabel": "Easy", "rightLabel": "Hard", "quadrants": ["Quick wins", "Major projects", "Fill-ins", "Thankless tasks"]}
  }]
}

Rules:
- First slide: layout "title". Last slide: layout "summary"
- 6-12 slides. PRIORITISE VISUAL LAYOUTS over plain content:
  * "stat-cards" for key metrics, numbers, percentages (2-4 cards)
  * "process-flow" for sequential steps, workflows, methods (3-6 steps)
  * "pyramid" for hierarchies, layers of abstraction (3-5 layers, narrowest first)
  * "comparison" for side-by-side contrast with labeled columns
  * "funnel" for narrowing stages, filtering processes (3-5 stages)
  * "cycle" for circular/recurring processes (3-6 steps)
  * "checklist" for key takeaways, requirements, principles
  * "matrix" for 2×2 frameworks, positioning, trade-offs
  * "timeline" for chronological sequences — MUST include timeline array
  * "table" for structured data, properties — MUST include tableData
  * "diagram" for concept relationships — include diagramItems
  * "two-column" for prose contrasts, pros/cons
  * "quote" for key principles or important ideas
- At least 3 slides MUST use visual layouts (not content/title/summary/quote)
- Each visual layout MUST include its corresponding data array
- Accents: sage=mastery, indigo=inquiry, amber=synthesis, margin=tutor
- Write in the tutor's voice: warm, precise, Socratic`;
