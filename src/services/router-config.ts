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
  systemInstruction: `Respond with ONLY a JSON object. No additional text.

Classify which AI agents should respond to the student's latest entry.

{"tutor": true, "research": false, "visualize": false, "illustrate": false, "deepMemory": false, "directive": false, "graphExplore": false, "reason": "one sentence"}

Decision rules (evaluate in order):
- tutor: always true
- research: the student asks a factual question, makes a verifiable claim, or the topic needs real scholarship to ground it
- visualize: the student is working with spatial relationships, timelines, hierarchies, or processes. NOT for simple Q&A or definitions
- illustrate: the student is exploring a physical system, natural structure, or mechanism that benefits from a drawn diagram
- deepMemory: the student references past sessions, asks about their own progress, or the response would be enriched by vocabulary/mastery/encounter history
- directive: the conversation has had 3+ standard exchanges without a directive, OR the student is ready for hands-on exploration outside the notebook
- graphExplore: the student mentions or alludes to a concept that likely has connections to other concepts, thinkers, or terms in their knowledge graph. Use when traversing the graph would surface connections the tutor should weave in

Default all to false except tutor. Only flag when genuinely valuable — visualize, illustrate, and directive are expensive. graphExplore and deepMemory are cheap — flag liberally when relevant.`,
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
