/**
 * Router Agent — lightweight classifier that decides which agents
 * to invoke after a student writes a block.
 *
 * Uses gemini-3.1-flash-lite with MINIMAL thinking for speed.
 * Returns a structured routing decision, not free text.
 *
 * Design principles:
 * 1. Debounce: don't classify every keystroke, only complete blocks
 * 2. Batch: accumulate recent entries and classify as a group
 * 3. Cooldown: don't invoke expensive agents too frequently
 * 4. Cheap: flash-lite + minimal thinking = ~100ms response
 * 5. Deterministic fallback: if router fails, use safe defaults
 */
import { isGeminiAvailable } from './gemini';
import { runTextAgent } from './run-agent';
import type { AgentConfig } from './agents';
import type { LiveEntry } from '@/types/entries';

// ─── Router Agent Config ─────────────────────────────────────────────

const ROUTER_AGENT: AgentConfig = {
  name: 'Router',
  model: 'gemini-3.1-flash-lite-preview',
  systemInstruction: `You are a routing classifier for a Socratic tutoring system. Given the student's latest entry and recent conversation context, decide which AI agents should respond.

Return ONLY a JSON object with these boolean fields:
{
  "tutor": true,        // Always true — the tutor always responds
  "research": false,    // True if factual grounding needed (historical claims, specific facts, "who/what/when" questions)
  "visualize": false,   // True if a visual diagram, timeline, or concept map would help understanding
  "illustrate": false,  // True if a hand-drawn sketch would help (spatial/physical concepts)
  "deepMemory": false,  // True if student references past learning, asks about their progress, or the response would benefit from their full history
  "reason": ""          // One sentence explaining your routing decision
}

Routing heuristics:
- research=true: Student asks factual questions, makes claims that need verification, or the tutor would benefit from real scholarship to respond well
- visualize=true: Concepts with spatial relationships, timelines, hierarchies, processes, or comparisons. NOT for simple Q&A
- illustrate=true: Physical systems, anatomical structures, mechanical processes — things that are better shown than described
- deepMemory=true: References to past sessions, questions about progress, or when the student's vocabulary/mastery history would enrich the response

Be conservative with visualize and illustrate — they are expensive. Only flag them when they would genuinely aid understanding, not as decoration.`,
  thinkingLevel: 'MINIMAL',
  tools: [],
  responseModalities: ['TEXT'],
};

// ─── Routing decision ────────────────────────────────────────────────

export interface RoutingDecision {
  tutor: boolean;
  research: boolean;
  visualize: boolean;
  illustrate: boolean;
  deepMemory: boolean;
  reason: string;
  source: 'router' | 'fallback';
}

const DEFAULT_DECISION: RoutingDecision = {
  tutor: true,
  research: false,
  visualize: false,
  illustrate: false,
  deepMemory: false,
  reason: 'Default routing — tutor only',
  source: 'fallback',
};

// ─── Cooldown tracking ──────────────────────────────────────────────

const cooldowns: Record<string, number> = {};

const COOLDOWN_MS: Record<string, number> = {
  research: 30_000,   // 30s between research calls
  visualize: 60_000,  // 60s between visualizations
  illustrate: 60_000, // 60s between illustrations
  deepMemory: 20_000, // 20s between deep memory queries
};

function isOnCooldown(agent: string): boolean {
  const last = cooldowns[agent] ?? 0;
  const cooldown = COOLDOWN_MS[agent] ?? 0;
  return Date.now() - last < cooldown;
}

function markUsed(agent: string): void {
  cooldowns[agent] = Date.now();
}

// ─── Debounce tracking ──────────────────────────────────────────────

let pendingTimeout: ReturnType<typeof setTimeout> | null = null;
let pendingResolve: ((d: RoutingDecision) => void) | null = null;
let pendingText: string | null = null;
let pendingEntries: LiveEntry[] = [];

const DEBOUNCE_MS = 800; // Wait 800ms after last entry before routing

// ─── Public API ──────────────────────────────────────────────────────

/**
 * Classify a student entry and decide which agents to invoke.
 * Debounced: if called rapidly, only the last call executes.
 * Returns a routing decision with cooldown enforcement.
 */
export function classifyEntry(
  studentText: string,
  recentEntries: LiveEntry[],
): Promise<RoutingDecision> {
  // Cancel any pending classification
  if (pendingTimeout) {
    clearTimeout(pendingTimeout);
    // Resolve the previous promise with default
    pendingResolve?.(DEFAULT_DECISION);
  }

  pendingText = studentText;
  pendingEntries = recentEntries;

  return new Promise((resolve) => {
    pendingResolve = resolve;
    pendingTimeout = setTimeout(async () => {
      pendingTimeout = null;
      pendingResolve = null;

      const text = pendingText;
      const entries = pendingEntries;
      if (!text) {
        resolve(DEFAULT_DECISION);
        return;
      }

      const decision = await executeClassification(text, entries);
      resolve(decision);
    }, DEBOUNCE_MS);
  });
}

/**
 * Classify immediately without debounce.
 * Use when you know the entry is final (e.g., Enter pressed).
 */
export async function classifyImmediate(
  studentText: string,
  recentEntries: LiveEntry[],
): Promise<RoutingDecision> {
  // Cancel any pending debounced call
  if (pendingTimeout) {
    clearTimeout(pendingTimeout);
    pendingResolve?.(DEFAULT_DECISION);
    pendingTimeout = null;
    pendingResolve = null;
  }

  return executeClassification(studentText, recentEntries);
}

// ─── Internal classification ─────────────────────────────────────────

async function executeClassification(
  studentText: string,
  recentEntries: LiveEntry[],
): Promise<RoutingDecision> {
  if (!isGeminiAvailable()) return DEFAULT_DECISION;

  // Build compact context (last 6 entries, not 12 — router needs less)
  const context = recentEntries.slice(-6).map((le) => {
    const e = le.entry;
    if ('content' in e) return `[${e.type}]: ${e.content}`;
    return `[${e.type}]`;
  }).join('\n');

  const prompt = `Recent conversation:
${context || '(new conversation)'}

Student's latest entry:
"${studentText}"

Classify this entry. Return JSON only.`;

  try {
    const result = await runTextAgent(ROUTER_AGENT, [
      { role: 'user', parts: [{ text: prompt }] },
    ]);

    const cleaned = result.text
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .trim();

    const parsed = JSON.parse(cleaned) as Record<string, unknown>;
    const decision: RoutingDecision = {
      tutor: true, // Always true
      research: Boolean(parsed.research) && !isOnCooldown('research'),
      visualize: Boolean(parsed.visualize) && !isOnCooldown('visualize'),
      illustrate: Boolean(parsed.illustrate) && !isOnCooldown('illustrate'),
      deepMemory: Boolean(parsed.deepMemory) && !isOnCooldown('deepMemory'),
      reason: typeof parsed.reason === 'string' ? parsed.reason : '',
      source: 'router',
    };

    // Mark cooldowns for activated agents
    if (decision.research) markUsed('research');
    if (decision.visualize) markUsed('visualize');
    if (decision.illustrate) markUsed('illustrate');
    if (decision.deepMemory) markUsed('deepMemory');

    return decision;
  } catch (err) {
    console.error('[Ember] Router classification error:', err);
    return DEFAULT_DECISION;
  }
}
