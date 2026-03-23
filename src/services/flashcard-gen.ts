/**
 * Flashcard Generation — produces structured flashcard decks from the
 * tutor agent. Uses conversation context to target cards at the student's
 * actual exploration, not generic knowledge.
 */
import { VISUALISER_AGENT } from './agents';
import { runTextAgent } from './run-agent';
import type { NotebookEntry, LiveEntry, Flashcard } from '@/types/entries';

const SYSTEM_PROMPT = `You are Ember's tutor creating a flashcard deck for active recall.
Output ONLY valid JSON — no markdown fences, no explanation.

Schema:
{
  "title": "string — deck title",
  "cards": [
    {
      "front": "string — question or prompt (Socratic, not trivial)",
      "back": "string — concise answer (2-3 sentences max)",
      "concept": "string — the concept being tested (optional)",
      "accent": "sage | indigo | amber | margin (optional)"
    }
  ],
  "sourceTopics": ["string — topics these cards cover"]
}

Rules:
- Generate 6-10 cards per deck
- Front side: Socratic questions that demand reasoning, not rote recall
- Back side: precise, warm, 2-3 sentences — teach, don't just answer
- Order by conceptual dependency (foundations first)
- Assign accents: sage for mastery, indigo for inquiry, amber for synthesis
- Cards should test understanding, not memory of specific words`;

export async function generateFlashcards(
  topic: string,
  entries: LiveEntry[],
): Promise<NotebookEntry | null> {
  try {
    const context = entries.slice(-6)
      .map((le) => 'content' in le.entry ? le.entry.content : '')
      .filter(Boolean).join('\n').slice(0, 600);

    const prompt = [
      `Create flashcards about: ${topic}`,
      context ? `\nStudent's recent exploration:\n${context}` : '',
      '\nOutput JSON only.',
    ].join('');

    const result = await runTextAgent(VISUALISER_AGENT, [{
      role: 'user',
      parts: [{ text: `${SYSTEM_PROMPT}\n\n${prompt}` }],
    }]);

    let raw = result.text.trim();
    raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();

    const parsed = JSON.parse(raw) as {
      title: string;
      cards: Flashcard[];
      sourceTopics?: string[];
    };

    if (!parsed.title || !Array.isArray(parsed.cards) || parsed.cards.length === 0) {
      return null;
    }

    const cards: Flashcard[] = parsed.cards.slice(0, 12).map((c) => ({
      front: String(c.front || ''),
      back: String(c.back || ''),
      concept: c.concept ? String(c.concept) : undefined,
      accent: validateAccent(c.accent),
    }));

    return {
      type: 'flashcard-deck',
      title: String(parsed.title),
      cards,
      sourceTopics: parsed.sourceTopics?.map(String),
    };
  } catch { /* not critical */ }
  return null;
}

const VALID_ACCENTS = new Set(['sage', 'indigo', 'amber', 'margin']);
function validateAccent(v: unknown): Flashcard['accent'] {
  if (!v) return undefined;
  return VALID_ACCENTS.has(v as string) ? v as Flashcard['accent'] : undefined;
}
