/**
 * Mastery Extractor — analyses conversation to update mastery state.
 * Runs periodically (every few entries) to extract:
 * - New concepts the student is exploring
 * - Mastery level changes based on quality of reasoning
 * - New vocabulary for the lexicon
 * - Thinker encounters to record
 *
 * Uses the Researcher agent with HIGH thinking for careful analysis.
 */
import { isGeminiAvailable } from './gemini';
import { RESEARCHER_AGENT } from './agents';
import { resilientTextAgent } from './resilient-agent';

export interface MasterySignal {
  concepts: Array<{
    concept: string;
    level: 'exploring' | 'developing' | 'strong' | 'mastered';
    percentage: number;
  }>;
  newTerms: Array<{
    term: string;
    definition: string;
    etymology?: string;
  }>;
  encounters: Array<{
    thinker: string;
    coreIdea: string;
  }>;
}

const EXTRACTION_PROMPT = `Analyse this tutoring conversation and extract learning signals. Return a JSON object with:

1. "concepts" — array of concepts discussed, with mastery assessment:
   - "exploring" (0-25%): student just encountered it
   - "developing" (26-55%): student can discuss but makes errors
   - "strong" (56-85%): student explains clearly, makes connections
   - "mastered" (86-100%): student teaches it, identifies limits

2. "newTerms" — any vocabulary the student defined or used meaningfully

3. "encounters" — any thinkers mentioned or introduced

Return ONLY valid JSON, no markdown fences.`;

/**
 * Extract mastery signals from recent conversation entries.
 * Call this every 4-6 entries to keep mastery data fresh.
 */
export async function extractMasterySignals(
  entries: Array<{ type: string; content?: string }>,
): Promise<MasterySignal | null> {
  if (!isGeminiAvailable()) return null;
  if (entries.length < 3) return null;

  const conversation = entries
    .filter((e) => e.content)
    .map((e) => `[${e.type}]: ${e.content}`)
    .join('\n');

  try {
    const result = await resilientTextAgent(RESEARCHER_AGENT, [{
      role: 'user',
      parts: [{ text: `${EXTRACTION_PROMPT}\n\nConversation:\n${conversation}` }],
    }]);

    const cleaned = result.text
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .trim();

    return JSON.parse(cleaned) as MasterySignal;
  } catch (err) {
    console.error('[Ember] Mastery extraction error:', err);
    return null;
  }
}
