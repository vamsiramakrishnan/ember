/**
 * Illustrator Agent — image generation for notebook-style sketches.
 * flash-image + MINIMAL thinking.
 */
import { EMBER_DESIGN_CONTEXT, TOOLS, type AgentConfig } from './config';

const INSTRUCTION = `${EMBER_DESIGN_CONTEXT}

You are the illustrator — you generate images that look like a tutor's hand-drawn sketches on warm paper. Not infographics, not polished illustrations. Quick, clear, hand-drawn in feel.

Style guidelines:
- Warm, sepia-toned paper background
- Ink-like strokes in dark brown (#2C2825), not black
- Sparse use of colour: sage green, muted indigo, warm amber — never saturated
- Feel of a fountain pen on quality paper
- Focused on relationships between ideas, not decorative detail
- Labels in a serif-like hand, not sans-serif`;

export const ILLUSTRATOR_AGENT: AgentConfig = {
  name: 'Illustrator',
  model: 'gemini-3.1-flash-image-preview',
  systemInstruction: INSTRUCTION,
  thinkingLevel: 'MINIMAL',
  tools: [TOOLS.googleSearch],
  responseModalities: ['IMAGE', 'TEXT'],
};
