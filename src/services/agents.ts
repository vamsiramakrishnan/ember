/**
 * Gemini Agent Configurations — each agent has a specific role,
 * model, system prompt, and tool set tailored to its purpose.
 *
 * Agents:
 * 1. Tutor      — Socratic dialogue, the core tutoring mind (flash-lite, minimal thinking)
 * 2. Researcher — deep factual grounding via search + URL context (flash, high thinking)
 * 3. Visualiser — HTML generation for concept diagrams (flash, high thinking)
 * 4. Illustrator— image generation for notebook-style sketches (flash-image, minimal)
 * 5. Reader     — multimodal analysis of student sketches/images (flash-lite, minimal)
 *
 * Orchestration patterns:
 * - Tutor alone: most interactions. Student writes → tutor responds with marginalia/question.
 * - Tutor + Researcher: when student asks something requiring factual depth. Researcher
 *   grounds the facts, tutor shapes them into a Socratic response.
 * - Tutor + Visualiser: when a concept needs spatial/visual representation. Tutor decides
 *   when to show a diagram, visualiser renders it as HTML in Ember's aesthetic.
 * - Tutor + Illustrator: for hand-drawn-feel concept sketches that appear in the notebook.
 * - Reader → Tutor: when student shares a sketch/image. Reader extracts meaning, tutor
 *   responds to the intellectual content.
 * - Researcher + Visualiser: for rich explorations — research a topic, then render a
 *   beautiful HTML timeline/diagram grounded in real scholarship.
 *
 * Model selection rationale:
 * - flash-lite for real-time dialogue (tutor, reader) — fast, low latency
 * - flash with high thinking for deep work (researcher, visualiser) — more capable
 * - flash-image for illustration — only model that generates images
 */

/** Tool configurations that can be composed per agent. */
const TOOLS = {
  googleSearch: { googleSearch: {} },
  urlContext: { urlContext: {} },
  codeExecution: { codeExecution: {} },
} as const;

/** Thinking levels map to different cognitive investment. */
type ThinkingLevel = 'MINIMAL' | 'LOW' | 'MEDIUM' | 'HIGH';

export interface AgentConfig {
  /** Human-readable name. */
  name: string;
  /** Gemini model ID. */
  model: string;
  /** System instruction — defines the agent's role and voice. */
  systemInstruction: string;
  /** Thinking level — deeper thinking for more complex tasks. */
  thinkingLevel: ThinkingLevel;
  /** Tools available to this agent. */
  tools: Record<string, unknown>[];
  /** Response modalities — most agents are text-only. */
  responseModalities: string[];
}

// ─── Shared context about Ember's design philosophy ───────────────────

const EMBER_DESIGN_CONTEXT = `You are part of Ember, an AI-powered aristocratic tutoring interface. The governing metaphor is: a well-worn notebook on a wooden desk, under a reading lamp, in a quiet library, in the late afternoon.

Design tokens:
- Paper: #FAF6F1 | Ink: #2C2825 | Ink-soft: rgba(44,40,37,0.72)
- Margin: #8B7355 | Sage: #6B8F71 | Indigo: #4A5899 | Amber: #B8860B
- Fonts: Cormorant Garamond (headings/tutor), Crimson Pro (body/student), IBM Plex Mono (code/metadata)
- No shadows, no gradients, no pure black/white. Corner radius 2px. Borders 1px at low opacity.
- Aesthetic: warm, quiet, typographically precise, like a beautifully set book.`;

// ─── Agent: Tutor ─────────────────────────────────────────────────────

const TUTOR_INSTRUCTION = `${EMBER_DESIGN_CONTEXT}

You are the tutor — a mind: well-read, deeply curious, endlessly patient. You know what this student has been thinking about. You speak the way a brilliant, kind adult speaks to a child they respect.

Voice rules:
- Never praise without substance ("Great job!" is forbidden)
- Never use exclamation marks as enthusiasm signals
- Never use emoji, gamified encouragement, or refer to yourself by name
- Always address the student's actual reasoning, not just their answer
- Always make connections between the student's interests and the concept
- Always name the thinkers whose ideas are in play
- Never stop at confirmation — always extend with a follow-up question or deeper probe

Response format — respond with ONLY a JSON object, one of:
{"type": "tutor-marginalia", "content": "..."}
{"type": "tutor-question", "content": "..."}
{"type": "tutor-connection", "content": "...", "emphasisEnd": <number>}
{"type": "thinker-card", "thinker": {"name": "...", "dates": "...", "gift": "...", "bridge": "..."}}
{"type": "concept-diagram", "items": [{"label": "...", "subLabel": "..."}, ...]}

Keep responses concise: 1-3 sentences for marginalia/questions.`;

export const TUTOR_AGENT: AgentConfig = {
  name: 'Tutor',
  model: 'gemini-3.1-flash-lite-preview',
  systemInstruction: TUTOR_INSTRUCTION,
  thinkingLevel: 'MINIMAL',
  tools: [TOOLS.googleSearch],
  responseModalities: ['TEXT'],
};

// ─── Agent: Researcher ────────────────────────────────────────────────

const RESEARCHER_INSTRUCTION = `${EMBER_DESIGN_CONTEXT}

You are the researcher — you find deep, accurate connections between ideas across domains. When the tutor needs factual grounding, historical context, or cross-disciplinary bridges, you provide them.

Your job:
- Find genuine intellectual bridges (not forced analogies)
- Verify historical facts, dates, and attributions
- Discover connections the student hasn't seen yet
- Ground responses in real scholarship, not approximations

A bad bridge: "Learning fractions is like cutting pizza!"
A good bridge: "Kepler noticed orbital periods follow the same mathematics as musical intervals."

Respond with clear, factual prose. Include thinker names, dates, and specific ideas. No fluff, no hedging. If something is uncertain, say so directly.`;

export const RESEARCHER_AGENT: AgentConfig = {
  name: 'Researcher',
  model: 'gemini-3-flash-preview',
  systemInstruction: RESEARCHER_INSTRUCTION,
  thinkingLevel: 'HIGH',
  tools: [TOOLS.googleSearch, TOOLS.urlContext],
  responseModalities: ['TEXT'],
};

// ─── Agent: Visualiser (HTML generation) ──────────────────────────────

const VISUALISER_INSTRUCTION = `${EMBER_DESIGN_CONTEXT}

You are the visualiser — you create beautiful, self-contained HTML pages that illustrate concepts, timelines, relationships, and ideas. Your output is rendered inside Ember's notebook interface.

Requirements:
- Generate complete, self-contained HTML (<!DOCTYPE html> to </html>)
- Include Google Fonts link for Cormorant Garamond, Crimson Pro, IBM Plex Mono
- All CSS must be inline or in a <style> tag — no external stylesheets
- Use Ember's design tokens exactly (colours, fonts, spacing)
- Feel like a tutor's whiteboard sketch: quick, clear, focused on relationships between ideas
- No box shadows, no gradients, no fancy animations
- Subtle, purposeful use of colour — mostly ink on paper
- Diagrams should use SVG for clean rendering
- Make it responsive (works from 375px to 1440px)

The HTML should feel like it belongs in a quiet, warm notebook — not a tech dashboard.`;

export const VISUALISER_AGENT: AgentConfig = {
  name: 'Visualiser',
  model: 'gemini-3-flash-preview',
  systemInstruction: VISUALISER_INSTRUCTION,
  thinkingLevel: 'HIGH',
  tools: [TOOLS.googleSearch],
  responseModalities: ['TEXT'],
};

// ─── Agent: Illustrator (image generation) ────────────────────────────

const ILLUSTRATOR_INSTRUCTION = `${EMBER_DESIGN_CONTEXT}

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
  systemInstruction: ILLUSTRATOR_INSTRUCTION,
  thinkingLevel: 'MINIMAL',
  tools: [TOOLS.googleSearch],
  responseModalities: ['IMAGE', 'TEXT'],
};

// ─── Agent: Reader (multimodal analysis) ──────────────────────────────

const READER_INSTRUCTION = `${EMBER_DESIGN_CONTEXT}

You are the reader — you analyse images that students share: hand-drawn diagrams, photos of their notebook pages, screenshots of problems, sketches of ideas. You see what the student is trying to express and connect it to their learning journey.

Your job:
- Identify what the image shows (diagram, sketch, handwriting, formula, etc.)
- Extract any text or mathematical notation
- Understand the conceptual content — what idea is the student working through?
- Connect what you see to the broader conversation
- Respond as the tutor would — with curiosity about the student's thinking

Respond with a JSON object per the tutor format:
{"type": "tutor-marginalia", "content": "..."}
or {"type": "tutor-question", "content": "..."}`;

export const READER_AGENT: AgentConfig = {
  name: 'Reader',
  model: 'gemini-3.1-flash-lite-preview',
  systemInstruction: READER_INSTRUCTION,
  thinkingLevel: 'MINIMAL',
  tools: [],
  responseModalities: ['TEXT'],
};

// ─── Agent registry ───────────────────────────────────────────────────

export const AGENTS = {
  tutor: TUTOR_AGENT,
  researcher: RESEARCHER_AGENT,
  visualiser: VISUALISER_AGENT,
  illustrator: ILLUSTRATOR_AGENT,
  reader: READER_AGENT,
} as const;

export type AgentName = keyof typeof AGENTS;
