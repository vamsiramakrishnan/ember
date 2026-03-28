/**
 * Status Narrator — uses Gemma 3 1B IT to generate warm, descriptive
 * status messages during long-running tutor processes.
 *
 * Instead of static labels like "researching..." or "thinking...",
 * the narrator streams short, contextual descriptions of what the
 * tutor is doing, matched to the Ember voice.
 *
 * Example outputs:
 *   "gathering threads on orbital resonance..."
 *   "connecting Kepler's harmonics to Pythagoras..."
 *   "leafing through the history of equal temperament..."
 *
 * The narrator is fire-and-forget: if Gemma fails, the existing
 * static labels remain. No degradation to the core experience.
 */
import { gemmaStream } from './gemma';
import type { TutorActivityStep } from '@/state/session-state-types';

/** Subscriber callback for streaming narration chunks. */
export type NarrationChunkCallback = (text: string) => void;

/** Active narration — can be cancelled when the step changes. */
interface ActiveNarration {
  step: TutorActivityStep;
  abort: AbortController;
}

let activeNarration: ActiveNarration | null = null;
const listeners = new Set<NarrationChunkCallback>();
let currentNarration = '';

/** Subscribe to narration text updates. Returns unsubscribe function. */
export function subscribeNarration(cb: NarrationChunkCallback): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/** Get the current narration text. */
export function getCurrentNarration(): string {
  return currentNarration;
}

/** Cancel any active narration. */
export function cancelNarration(): void {
  if (activeNarration) {
    activeNarration.abort.abort();
    activeNarration = null;
  }
  currentNarration = '';
  emit('');
}

function emit(text: string): void {
  currentNarration = text;
  for (const cb of listeners) cb(text);
}

/** Gemma system prompt for status narration. */
const NARRATOR_SYSTEM = `You narrate what a thoughtful tutor is doing, in 4-10 words.
Use present participles. Be specific to the topic. Be warm, quiet, unhurried.
Never use exclamation marks. Never be generic. One phrase only, no punctuation at end.
Examples: "tracing the etymology of 'resonance'", "connecting Euler's identity to harmony"`;

/** Step-to-context hints for richer narration. */
const STEP_HINTS: Partial<Record<TutorActivityStep, string>> = {
  routing: 'reading and understanding the student input',
  researching: 'searching for factual grounding and references',
  thinking: 'formulating a thoughtful Socratic response',
  'searching-graph': 'traversing the knowledge graph for connections',
  streaming: 'composing the written response',
  visualizing: 'designing a concept visualization or diagram',
  illustrating: 'sketching an illustration to clarify a concept',
  reflecting: 'looking back at the conversation for deeper patterns',
  refining: 'iterating on a draft to improve clarity and depth',
  enriching: 'adding background context and cross-references',
};

/**
 * Start narrating a pipeline step. Streams descriptive text via Gemma.
 *
 * @param step - The current pipeline step
 * @param studentText - What the student said (for context)
 * @param topic - Optional topic hint for more specific narration
 */
export function narrateStep(
  step: TutorActivityStep,
  studentText: string,
  topic?: string,
): void {
  // Cancel previous narration
  if (activeNarration) {
    activeNarration.abort.abort();
  }

  const abort = new AbortController();
  activeNarration = { step, abort };

  const hint = STEP_HINTS[step] ?? 'working on the response';
  const topicClause = topic ? ` about "${topic}"` : '';
  const prompt = `The tutor is ${hint}${topicClause}.
Student said: "${studentText.slice(0, 100)}"
Narrate what the tutor is doing in one short phrase (4-10 words):`;

  // Fire and forget — errors are silently swallowed
  void runNarration(prompt, step, abort.signal);
}

async function runNarration(
  prompt: string,
  step: TutorActivityStep,
  signal: AbortSignal,
): Promise<void> {
  try {
    await gemmaStream(
      prompt,
      (_chunk, accumulated) => {
        if (signal.aborted) return;
        // Take only the first line (Gemma may over-generate)
        const firstLine = (accumulated.split('\n')[0] ?? '').trim();
        // Strip quotes if Gemma wraps in them
        const clean = firstLine.replace(/^["']|["']$/g, '').toLowerCase();
        emit(clean);
      },
      { systemInstruction: NARRATOR_SYSTEM, maxOutputTokens: 32 },
    );
  } catch {
    // Silent failure — static labels remain as fallback
    if (!signal.aborted && activeNarration?.step === step) {
      emit(''); // Clear to let static label show
    }
  }
}
