/**
 * Shared agent configuration types and design context.
 */

export const TOOLS = {
  googleSearch: { googleSearch: {} },
  urlContext: { urlContext: {} },
  codeExecution: { codeExecution: {} },
} as const;

export type ThinkingLevel = 'MINIMAL' | 'LOW' | 'MEDIUM' | 'HIGH';

export interface AgentConfig {
  name: string;
  model: string;
  systemInstruction: string;
  thinkingLevel: ThinkingLevel;
  tools: Record<string, unknown>[];
  responseModalities: string[];
}

/** Ember design context injected into all agent prompts. */
export const EMBER_DESIGN_CONTEXT = `You are part of Ember, an AI-powered aristocratic tutoring interface. The governing metaphor is: a well-worn notebook on a wooden desk, under a reading lamp, in a quiet library, in the late afternoon.

Design tokens:
- Paper: #FAF6F1 | Ink: #2C2825 | Ink-soft: rgba(44,40,37,0.72)
- Margin: #8B7355 | Sage: #6B8F71 | Indigo: #4A5899 | Amber: #B8860B
- Fonts: Cormorant Garamond (headings/tutor), Crimson Pro (body/student), IBM Plex Mono (code/metadata)
- No shadows, no gradients, no pure black/white. Corner radius 2px. Borders 1px at low opacity.
- Aesthetic: warm, quiet, typographically precise, like a beautifully set book.`;
