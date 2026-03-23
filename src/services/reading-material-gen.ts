/**
 * Reading Material Generation — produces structured slide decks.
 * Uses the shared structured-generator pipeline.
 */
import { generateStructured } from './structured-generator';
import type { NotebookEntry, LiveEntry, ReadingSlide } from '@/types/entries';

const VALID_LAYOUTS = new Set(['title', 'content', 'two-column', 'quote', 'diagram', 'summary']);
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

const SYSTEM_PROMPT = `You are Ember's tutor creating a reading material deck.
Output ONLY valid JSON — no markdown fences, no explanation.

Schema:
{
  "title": "string", "subtitle": "string (optional)",
  "slides": [{
    "heading": "string", "body": "string (markdown)",
    "layout": "title | content | two-column | quote | diagram | summary",
    "accent": "sage | indigo | amber | margin (optional)",
    "notes": "string (optional)"
  }]
}

Rules:
- First slide: layout "title". Last slide: layout "summary"
- 5-8 slides. Mix layouts. Warm, precise tutor voice
- Each slide body: 2-4 short paragraphs
- Accents: sage=mastery, indigo=inquiry, amber=synthesis, margin=tutor`;
