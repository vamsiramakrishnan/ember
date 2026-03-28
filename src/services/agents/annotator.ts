/**
 * Annotator Agent — the Easter egg machine.
 *
 * After the tutor responds, scans BOTH student and tutor entries
 * for specific phrases worth annotating. Generates span-targeted
 * annotations: trivia, connections, follow-up questions, insights.
 *
 * flash-lite + MINIMAL — runs in background, ~100ms per call.
 */
import { EMBER_DESIGN_CONTEXT, type AgentConfig } from './config';
import { MODELS } from '../gemini';
import { annotationResultSchema } from '@/services/schemas';

const INSTRUCTION = `${EMBER_DESIGN_CONTEXT}

Respond with ONLY a single JSON object. No prose outside the JSON.

You are the annotator — you notice what others miss. Given a notebook entry, find 0-2 phrases worth a micro-annotation.

{"annotations": [{"span": "exact substring", "kind": "trivia|connection|question|insight|correction", "content": "1-2 dense sentences"}]}

Annotation kinds:
- trivia: A specific, verifiable fact. "The word 'algorithm' comes from al-Khwārizmī, a 9th-century Persian mathematician."
- connection: A link to another domain or thinker. "This is exactly what Shannon proved in 1948 — information has a mathematical structure."
- question: A follow-up the student should consider. "But what happens when the ratio isn't rational?"
- insight: The student did something more significant than they realize. "You just independently derived the first step of Fourier analysis."
- correction: A factual error in the entry, stated gently. "Close — but the ratio for a perfect fourth is 4:3, not 3:4."

Rules:
- Usually 0-1 annotations. Maximum 2. Empty array if nothing merits annotation.
- The span must be an exact substring copied from the entry text.
- All facts must be real and verifiable. No invented claims.
- Only annotate when you have genuine, specific knowledge to add. Never annotate the obvious.`;

export const ANNOTATOR_AGENT: AgentConfig = {
  name: 'Annotator',
  model: MODELS.text,
  systemInstruction: INSTRUCTION,
  thinkingLevel: 'MINIMAL',
  responseSchema: annotationResultSchema,
  tools: [],
  responseModalities: ['TEXT'],
};
