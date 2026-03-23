/**
 * Reading Material Generation — produces structured slide decks
 * with rich visual layouts (timelines, tables, diagrams).
 * Uses the shared structured-generator pipeline.
 */
import { generateStructured } from './structured-generator';
import type { NotebookEntry, LiveEntry, ReadingSlide } from '@/types/entries';

const VALID_LAYOUTS = new Set([
  'title', 'content', 'two-column', 'quote', 'diagram', 'summary', 'timeline', 'table',
]);
const VALID_ACCENTS = new Set(['sage', 'indigo', 'amber', 'margin']);

interface RawDeck {
  title: string;
  subtitle?: string;
  slides: ReadingSlide[];
}

export async function generateReadingMaterial(
  topic: string,
  entries: LiveEntry[],
): Promise<NotebookEntry | null> {
  return generateStructured<RawDeck>(topic, entries, {
    systemPrompt: SYSTEM_PROMPT,
    validate: (parsed) => {
      if (!parsed.title || !Array.isArray(parsed.slides) || parsed.slides.length === 0) {
        return null;
      }
      const slides: ReadingSlide[] = parsed.slides.slice(0, 12).map((s) => ({
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
      return {
        type: 'reading-material',
        title: String(parsed.title),
        subtitle: parsed.subtitle ? String(parsed.subtitle) : undefined,
        slides,
      };
    },
  });
}

const SYSTEM_PROMPT = `You are Ember's tutor creating a visually rich reading material deck.
Output ONLY valid JSON — no markdown fences, no explanation.

Schema:
{
  "title": "string", "subtitle": "string (optional)",
  "slides": [{
    "heading": "string",
    "body": "string (markdown — always include for all layouts)",
    "layout": "title | content | two-column | quote | diagram | summary | timeline | table",
    "accent": "sage | indigo | amber | margin (optional)",
    "notes": "string (optional)",
    "timeline": [{"period": "1609", "event": "Kepler publishes", "detail": "optional"}],
    "tableData": {"headers": ["Concept", "Definition"], "rows": [["X", "Y"]]},
    "diagramItems": [{"label": "Concept A", "detail": "explanation"}]
  }]
}

Rules:
- First slide: layout "title". Last slide: layout "summary"
- 6-10 slides. USE VISUAL LAYOUTS:
  * "timeline" for chronological sequences — MUST include timeline array
  * "table" for comparisons, properties, categories — MUST include tableData
  * "diagram" for concept relationships, processes — include diagramItems
  * "two-column" for contrasts, pros/cons
  * "quote" for key principles or important ideas
- At least 2 slides MUST use timeline, table, or diagram layout
- Accents: sage=mastery, indigo=inquiry, amber=synthesis, margin=tutor
- Write in the tutor's voice: warm, precise, Socratic`;
