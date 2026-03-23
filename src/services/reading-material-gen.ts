/**
 * Reading Material Generation — produces structured slide decks
 * from the tutor agent. Uses the same Gemini pipeline as the
 * visualizer, but outputs structured JSON instead of HTML.
 */
import { VISUALISER_AGENT } from './agents';
import { runTextAgent } from './run-agent';
import type { NotebookEntry, LiveEntry, ReadingSlide } from '@/types/entries';

const SYSTEM_PROMPT = `You are Ember's tutor creating a reading material deck.
Output ONLY valid JSON — no markdown fences, no explanation.

Schema:
{
  "title": "string — clear, concise title",
  "subtitle": "string — one-line context (optional)",
  "slides": [
    {
      "heading": "string — slide heading",
      "body": "string — markdown body (use **bold**, *italic*, bullet lists)",
      "layout": "title | content | two-column | quote | diagram | summary",
      "accent": "sage | indigo | amber | margin (optional)",
      "notes": "string — speaker notes (optional)"
    }
  ]
}

Rules:
- First slide should use layout "title" to introduce the topic
- Use 5-8 slides for a focused explanation
- Last slide should use layout "summary" to consolidate key ideas
- Mix layouts: use "quote" for important ideas, "diagram" for structures
- Write in the tutor's voice: warm, precise, Socratic, never condescending
- Each slide body should be 2-4 short paragraphs
- Assign accent colours purposefully: sage for growth/mastery, indigo for inquiry,
  amber for connections/synthesis, margin for the tutor's voice`;

export async function generateReadingMaterial(
  topic: string,
  entries: LiveEntry[],
): Promise<NotebookEntry | null> {
  try {
    const context = entries.slice(-6)
      .map((le) => 'content' in le.entry ? le.entry.content : '')
      .filter(Boolean)
      .join('\n')
      .slice(0, 600);

    const prompt = [
      `Create a reading material deck about: ${topic}`,
      context ? `\nStudent's recent exploration:\n${context}` : '',
      '\nOutput JSON only.',
    ].join('');

    const result = await runTextAgent(VISUALISER_AGENT, [{
      role: 'user',
      parts: [{ text: `${SYSTEM_PROMPT}\n\n${prompt}` }],
    }]);

    let raw = result.text.trim();
    // Strip markdown code fences if present
    raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();

    const parsed = JSON.parse(raw) as {
      title: string;
      subtitle?: string;
      slides: ReadingSlide[];
    };

    if (!parsed.title || !Array.isArray(parsed.slides) || parsed.slides.length === 0) {
      return null;
    }

    // Validate and clamp slides
    const slides: ReadingSlide[] = parsed.slides.slice(0, 12).map((s) => ({
      heading: String(s.heading || 'Untitled'),
      body: String(s.body || ''),
      layout: validateLayout(s.layout),
      accent: validateAccent(s.accent),
      notes: s.notes ? String(s.notes) : undefined,
    }));

    return {
      type: 'reading-material',
      title: String(parsed.title),
      subtitle: parsed.subtitle ? String(parsed.subtitle) : undefined,
      slides,
    };
  } catch {
    // Generation failed — not critical
  }
  return null;
}

const VALID_LAYOUTS = new Set(['title', 'content', 'two-column', 'quote', 'diagram', 'summary']);
const VALID_ACCENTS = new Set(['sage', 'indigo', 'amber', 'margin']);

function validateLayout(v: unknown): ReadingSlide['layout'] {
  return VALID_LAYOUTS.has(v as string) ? v as ReadingSlide['layout'] : 'content';
}

function validateAccent(v: unknown): ReadingSlide['accent'] {
  if (!v) return undefined;
  return VALID_ACCENTS.has(v as string) ? v as ReadingSlide['accent'] : undefined;
}
