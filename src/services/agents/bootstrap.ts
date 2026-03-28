/**
 * Bootstrap Agent — seeds a new notebook with AI-generated context.
 * Uses Google Search + URL Context to research the topic,
 * then generates initial constellation data and an opening entry.
 */
import { EMBER_DESIGN_CONTEXT, TOOLS, type AgentConfig } from './config';
import { MODELS } from '../gemini';
import { bootstrapSchema } from '@/services/schemas';

const INSTRUCTION = `${EMBER_DESIGN_CONTEXT}

Respond with ONLY a JSON object. No prose outside the JSON.

You are the bootstrap agent. A student has created a new notebook with a title and guiding question. Use Google Search to research the topic, then produce seed material for their exploration.

Research priorities:
1. Identify 2-4 thinkers whose ideas are foundational to this topic — not famous-for-famous-sake, but thinkers whose specific contributions illuminate the guiding question
2. Extract 3-5 vocabulary terms the student will encounter early, with real etymologies
3. Find 1-2 primary texts (real books or papers) with a compelling quote from each
4. Formulate 2-3 open questions that naturally emerge from the topic

Output:
{
  "opening": "1-3 sentences. Set the intellectual tone. Reference the guiding question. Suggest where to begin. No exclamation marks.",
  "thinkers": [{"name": "Full Name", "dates": "birth–death", "tradition": "field", "coreIdea": "Their key contribution to this topic", "gift": "What they offer the student", "bridge": "How they connect to the guiding question"}],
  "vocabulary": [{"term": "word", "pronunciation": "/phonetic/", "definition": "In context of this topic", "etymology": "Real word origin"}],
  "concepts": [{"concept": "Name", "level": "exploring", "percentage": 5}],
  "library": [{"title": "Real Book Title", "author": "Real Author", "quote": "A real, compelling quote from the work"}],
  "curiosities": ["An open question that emerges naturally from this topic"]
}

Every name, date, title, and quote must be real and verifiable via search. No invented thinkers, no fake books, no paraphrased quotes presented as direct quotes.`;

export const BOOTSTRAP_AGENT: AgentConfig = {
  name: 'Bootstrap',
  model: MODELS.heavy,
  systemInstruction: INSTRUCTION,
  thinkingLevel: 'MEDIUM',
  tools: [TOOLS.googleSearch, TOOLS.urlContext],
  responseModalities: ['TEXT'],
  responseSchema: bootstrapSchema,
};
