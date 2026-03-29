/**
 * Output Format Generation — converts prior DAG node results into
 * formatted output types: slides, doc, notes, brief.
 *
 * These are "output verb" actions in the DAG. They always depend on a
 * prior content-producing node (research, explain, teach, etc.) and
 * reformat that content into the desired output shape.
 *
 * Architecture:
 *   Prior node result (text/entries) → format agent → typed NotebookEntry
 *
 * See: slash-commands.ts (output group), intent-dag.ts (format actions)
 */
import { generateStructured } from './structured-generator';
import { validateSlides } from './slide-validation';
import { generateCoverArt } from './visual-generation';
import type { NotebookEntry, LiveEntry, ReadingSlide } from '@/types/entries';

/** Output format verb IDs — must match IntentNode action enum. */
export type OutputFormat = 'slides' | 'doc' | 'notes' | 'brief';

/** Set of all output format verb IDs for quick membership checks. */
export const OUTPUT_FORMAT_IDS = new Set<string>(['slides', 'doc', 'notes', 'brief']);

/**
 * Check if a DAG action is an output format verb.
 */
export function isOutputFormat(action: string): action is OutputFormat {
  return OUTPUT_FORMAT_IDS.has(action);
}

// ─── Prior result extraction ──────────────────────────────────

/**
 * Extract text content from prior node entries for reformatting.
 */
function extractPriorText(entries: NotebookEntry[]): string {
  const parts: string[] = [];
  for (const entry of entries) {
    if ('content' in entry && typeof entry.content === 'string') {
      parts.push(entry.content);
    } else if (entry.type === 'reading-material') {
      parts.push(`# ${entry.title}`);
      if (entry.subtitle) parts.push(`_${entry.subtitle}_`);
      for (const slide of entry.slides) {
        parts.push(`## ${slide.heading}\n${slide.body}`);
      }
    } else if (entry.type === 'flashcard-deck') {
      parts.push(`# ${entry.title}`);
      for (const card of entry.cards) {
        parts.push(`Q: ${card.front}\nA: ${card.back}`);
      }
    } else if (entry.type === 'exercise-set') {
      parts.push(`# ${entry.title}`);
      for (const ex of entry.exercises) {
        parts.push(`Problem: ${ex.prompt}`);
      }
    } else if (entry.type === 'concept-diagram') {
      if (entry.title) parts.push(`Diagram: ${entry.title}`);
      for (const item of entry.items) {
        parts.push(`- ${item.label}${item.subLabel ? `: ${item.subLabel}` : ''}`);
      }
    }
  }
  return parts.join('\n\n');
}

// ─── Format: Slides ───────────────────────────────────────────

interface RawDeck {
  title: string;
  subtitle?: string;
  slides: ReadingSlide[];
}

const SLIDES_PROMPT = `You are Ember's tutor creating a visually rich slide deck from existing content.
Output ONLY valid JSON — no markdown fences, no explanation.

You are REFORMATTING existing research/explanation into a slide presentation.
Preserve all important information but restructure for visual presentation.

Schema:
{
  "title": "string", "subtitle": "string (optional)",
  "slides": [{
    "heading": "string",
    "body": "string (markdown — always include for all layouts)",
    "layout": "title | content | two-column | quote | diagram | summary | timeline | table | stat-cards | process-flow | pyramid | comparison | funnel | cycle | checklist | matrix",
    "accent": "sage | indigo | amber | margin (optional)"
  }]
}

Guidelines:
- Create 6–12 slides that tell a coherent story
- Use varied layouts: at least 3 different layout types
- Start with a "title" slide, end with a "summary" slide
- Use "stat-cards" for key numbers, "process-flow" for sequences
- Use "comparison" for contrasts, "timeline" for historical progressions
- Keep body text concise — slides are visual, not essays
- Include structured data fields for rich layouts (timelineData, tableData, etc.)`;

async function formatAsSlides(
  topic: string, priorText: string,
): Promise<NotebookEntry | null> {
  return generateStructured<RawDeck>(topic, [], {
    systemPrompt: SLIDES_PROMPT,
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
  }, `Source content to reformat as slides:\n\n${priorText}`);
}

// ─── Format: Doc (long-form document) ─────────────────────────

const DOC_PROMPT = `You are Ember's tutor creating a structured document from existing content.
Output ONLY valid JSON — no markdown fences, no explanation.

You are REFORMATTING existing research/explanation into a well-structured document.
Preserve all important information but restructure for reading flow.

Schema:
{
  "title": "string", "subtitle": "string (optional)",
  "slides": [{
    "heading": "string",
    "body": "string (markdown — longer, more detailed paragraphs than slides)",
    "layout": "title | content | two-column | quote | summary | table",
    "accent": "sage | indigo | amber | margin (optional)"
  }]
}

Guidelines:
- Create 4–8 sections with substantial body text
- Use "content" layout for most sections (these are document sections, not slides)
- Use "quote" for notable quotes or key takeaways
- Use "two-column" for comparisons or side-by-side information
- Use "table" when tabular data would help
- Write full paragraphs — this is a document, not a presentation
- Start with a "title" section, end with a "summary"`;

async function formatAsDoc(
  topic: string, priorText: string,
): Promise<NotebookEntry | null> {
  return generateStructured<RawDeck>(topic, [], {
    systemPrompt: DOC_PROMPT,
    validate: (parsed) => {
      if (!parsed.title || !Array.isArray(parsed.slides) || parsed.slides.length === 0) {
        return null;
      }
      const slides = validateSlides(parsed.slides);
      return {
        type: 'reading-material',
        title: String(parsed.title),
        subtitle: parsed.subtitle ? String(parsed.subtitle) : undefined,
        slides,
      };
    },
  }, `Source content to reformat as a document:\n\n${priorText}`);
}

// ─── Format: Notes (concise study notes) ──────────────────────

const NOTES_PROMPT = `You are Ember's tutor distilling content into concise study notes.
Output ONLY valid JSON — no markdown fences, no explanation.

You are CONDENSING existing research/explanation into brief, scannable notes.

Schema:
{
  "title": "string", "subtitle": "string (optional)",
  "slides": [{
    "heading": "string",
    "body": "string (markdown — concise bullets and key points only)",
    "layout": "content | checklist | stat-cards | summary",
    "accent": "sage | indigo | amber | margin (optional)",
    "checklistItems": [{"item": "string"}]
  }]
}

Guidelines:
- Create 3–5 sections maximum
- Use bullet points, not paragraphs
- Each bullet is one key idea — no fluff
- Use "checklist" for lists of key points
- Use "stat-cards" for important numbers or facts
- End with a "summary" of the 3 most important takeaways
- Be ruthlessly concise — these are revision notes`;

async function formatAsNotes(
  topic: string, priorText: string,
): Promise<NotebookEntry | null> {
  return generateStructured<RawDeck>(topic, [], {
    systemPrompt: NOTES_PROMPT,
    validate: (parsed) => {
      if (!parsed.title || !Array.isArray(parsed.slides) || parsed.slides.length === 0) {
        return null;
      }
      const slides = validateSlides(parsed.slides);
      return {
        type: 'reading-material',
        title: `Notes: ${String(parsed.title)}`,
        subtitle: parsed.subtitle ? String(parsed.subtitle) : undefined,
        slides,
      };
    },
  }, `Source content to condense into notes:\n\n${priorText}`);
}

// ─── Format: Brief (one-page executive summary) ───────────────

const BRIEF_PROMPT = `You are Ember's tutor creating a one-page executive summary.
Output ONLY valid JSON — no markdown fences, no explanation.

You are CONDENSING existing research/explanation into a single-page brief.

Schema:
{
  "title": "string", "subtitle": "string (optional)",
  "slides": [{
    "heading": "string",
    "body": "string (markdown)",
    "layout": "title | content | stat-cards | summary",
    "accent": "sage | indigo | amber | margin (optional)"
  }]
}

Guidelines:
- Create exactly 2–3 sections: title, main content, conclusion
- The main content section should be a single, well-crafted paragraph (4–6 sentences)
- If there are key numbers, use "stat-cards" layout
- End with 2–3 bullet takeaways in a "summary" section
- Think of this as a one-page briefing document for someone in a hurry`;

async function formatAsBrief(
  topic: string, priorText: string,
): Promise<NotebookEntry | null> {
  return generateStructured<RawDeck>(topic, [], {
    systemPrompt: BRIEF_PROMPT,
    validate: (parsed) => {
      if (!parsed.title || !Array.isArray(parsed.slides) || parsed.slides.length === 0) {
        return null;
      }
      const slides = validateSlides(parsed.slides);
      return {
        type: 'reading-material',
        title: `Brief: ${String(parsed.title)}`,
        subtitle: parsed.subtitle ? String(parsed.subtitle) : undefined,
        slides,
      };
    },
  }, `Source content to condense into a one-page brief:\n\n${priorText}`);
}

// ─── Public API ───────────────────────────────────────────────

const FORMAT_HANDLERS: Record<OutputFormat, (topic: string, text: string) => Promise<NotebookEntry | null>> = {
  slides: formatAsSlides,
  doc: formatAsDoc,
  notes: formatAsNotes,
  brief: formatAsBrief,
};

/**
 * Generate formatted output from prior node results.
 *
 * @param format — The output format verb (slides, doc, notes, brief)
 * @param topic — The topic being formatted
 * @param priorEntries — Entries from prior DAG nodes to reformat
 * @returns A NotebookEntry (reading-material) or null on failure
 */
export async function generateOutputFormat(
  format: OutputFormat,
  topic: string,
  priorEntries: NotebookEntry[],
): Promise<NotebookEntry | null> {
  const priorText = extractPriorText(priorEntries);
  if (!priorText.trim()) return null;

  const handler = FORMAT_HANDLERS[format];
  return handler(topic, priorText);
}

/**
 * Generate formatted output from raw text content.
 * Used when the output verb is standalone (no prior DAG nodes).
 */
export async function generateOutputFormatFromText(
  format: OutputFormat,
  topic: string,
  _entries: LiveEntry[],
  context?: string,
): Promise<NotebookEntry | null> {
  const handler = FORMAT_HANDLERS[format];
  return handler(topic, context ?? topic);
}
