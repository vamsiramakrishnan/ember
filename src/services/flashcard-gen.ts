/**
 * Flashcard Generation — produces Socratic flashcard decks.
 * Uses the shared structured-generator pipeline.
 */
import { generateStructured } from './structured-generator';
import { refineContent } from './content-refiner';
import type { NotebookEntry, LiveEntry, Flashcard } from '@/types/entries';

const VALID_ACCENTS = new Set(['sage', 'indigo', 'amber', 'margin']);

interface RawDeck {
  title: string;
  cards: Flashcard[];
  sourceTopics?: string[];
}

export async function generateFlashcards(
  topic: string,
  entries: LiveEntry[],
  enrichedContext?: string,
): Promise<NotebookEntry | null> {
  const raw = await generateStructured<RawDeck>(topic, entries, {
    systemPrompt: SYSTEM_PROMPT,
    validate: (parsed) => {
      if (!parsed.title || !Array.isArray(parsed.cards) || parsed.cards.length === 0) {
        return null;
      }
      const cards: Flashcard[] = parsed.cards.slice(0, 12).map((c) => ({
        front: String(c.front || ''),
        back: String(c.back || ''),
        concept: c.concept ? String(c.concept) : undefined,
        accent: c.accent && VALID_ACCENTS.has(c.accent) ? c.accent : undefined,
      }));
      return {
        type: 'flashcard-deck',
        title: String(parsed.title),
        cards,
        sourceTopics: parsed.sourceTopics?.map(String),
      };
    },
  }, enrichedContext);
  if (!raw) return null;
  const { entry: refined } = await refineContent(raw, topic, enrichedContext);
  return refined;
}

const SYSTEM_PROMPT = `You are Ember's tutor creating a flashcard deck for active recall.
Output ONLY valid JSON — no markdown fences, no explanation.

Schema:
{
  "title": "string",
  "cards": [{
    "front": "string (Socratic question, not trivial)",
    "back": "string (concise, 2-3 sentences)",
    "concept": "string (optional)",
    "accent": "sage | indigo | amber | margin (optional)"
  }],
  "sourceTopics": ["string"]
}

Rules:
- 6-10 cards. Front: questions demanding reasoning. Back: teach, don't just answer
- Order by conceptual dependency. Test understanding, not word memory
- Accents: sage=mastery, indigo=inquiry, amber=synthesis`;
