/**
 * Router Config — agent configuration and cooldown tracking
 * for the routing classifier.
 *
 * Split from router-agent.ts for the 150-line file-size discipline.
 */
import { routingSchema } from './schemas';
import type { AgentConfig } from './agents';

// ─── Router Agent Config ─────────────────────────────────────────────

export const ROUTER_AGENT: AgentConfig = {
  name: 'Router',
  model: 'gemini-3.1-flash-lite-preview',
  systemInstruction: `You are a routing classifier for a Socratic tutoring system. Given the student's latest entry and recent conversation context, decide which AI agents should respond.

Return ONLY a JSON object with these boolean fields:
{
  "tutor": true,        // Always true — the tutor always responds
  "research": false,    // True if factual grounding needed
  "visualize": false,   // True if a concept diagram would help
  "illustrate": false,  // True if a hand-drawn sketch would help
  "deepMemory": false,  // True if past learning context would help
  "directive": false,   // True if the tutor should send the student to explore something outside the notebook
  "reason": ""          // One sentence explaining your routing decision
}

Routing heuristics:
- research=true: Student asks factual questions, makes claims needing verification, or the tutor needs real scholarship
- visualize=true: Spatial relationships, timelines, hierarchies, processes. NOT for simple Q&A
- illustrate=true: Physical systems, anatomical structures, mechanical processes
- deepMemory=true: References past sessions, progress questions, or vocabulary/mastery history enriches the response
- directive=true: After 3-4 standard exchanges, OR when the student is ready for hands-on exploration, OR when a specific book/search/experiment would deepen understanding. The tutor should push them outside the notebook

Be conservative with visualize, illustrate, and directive — they are expensive or disruptive. Only flag when genuinely valuable.`,
  thinkingLevel: 'MINIMAL',
  tools: [],
  responseModalities: ['TEXT'],
  responseSchema: routingSchema,
};

// ─── Cooldown tracking ──────────────────────────────────────────────

const cooldowns: Record<string, number> = {};

const COOLDOWN_MS: Record<string, number> = {
  research: 30_000,    // 30s between research calls
  visualize: 60_000,   // 60s between visualizations
  illustrate: 60_000,  // 60s between illustrations
  deepMemory: 20_000,  // 20s between deep memory queries
  directive: 45_000,   // 45s between exploration directives
};

export function isOnCooldown(agent: string): boolean {
  const last = cooldowns[agent] ?? 0;
  const cooldown = COOLDOWN_MS[agent] ?? 0;
  return Date.now() - last < cooldown;
}

export function markUsed(agent: string): void {
  cooldowns[agent] = Date.now();
}
