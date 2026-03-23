/**
 * Router Agent — lightweight classifier that decides which agents
 * to invoke after a student writes a block. Uses gemini-3.1-flash-lite
 * with MINIMAL thinking for speed (~100ms). Debounced with cooldowns.
 */
import { isGeminiAvailable } from './gemini';
import { runTextAgent } from './run-agent';
import { ROUTER_AGENT, isOnCooldown, markUsed } from './router-config';
import type { LiveEntry } from '@/types/entries';

export interface RoutingDecision {
  tutor: boolean;
  research: boolean;
  visualize: boolean;
  illustrate: boolean;
  deepMemory: boolean;
  /** Whether the tutor should use a directive (exploration instruction). */
  directive: boolean;
  /** Whether the tutor should explore the knowledge graph for connections. */
  graphExplore: boolean;
  reason: string;
  source: 'router' | 'fallback';
}

const DEFAULT_DECISION: RoutingDecision = {
  tutor: true,
  research: false,
  visualize: false,
  illustrate: false,
  deepMemory: false,
  directive: false,
  graphExplore: false,
  reason: 'Default routing — tutor only',
  source: 'fallback',
};

let pendingTimeout: ReturnType<typeof setTimeout> | null = null;
let pendingResolve: ((d: RoutingDecision) => void) | null = null;
let pendingText: string | null = null;
let pendingEntries: LiveEntry[] = [];
const DEBOUNCE_MS = 800;

/**
 * Classify a student entry and decide which agents to invoke.
 * Debounced: if called rapidly, only the last call executes.
 */
export function classifyEntry(
  studentText: string,
  recentEntries: LiveEntry[],
): Promise<RoutingDecision> {
  if (pendingTimeout) {
    clearTimeout(pendingTimeout);
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
      if (!text) { resolve(DEFAULT_DECISION); return; }
      resolve(await executeClassification(text, entries));
    }, DEBOUNCE_MS);
  });
}

/** Classify immediately without debounce (e.g., Enter pressed). */
export async function classifyImmediate(
  studentText: string,
  recentEntries: LiveEntry[],
): Promise<RoutingDecision> {
  if (pendingTimeout) {
    clearTimeout(pendingTimeout);
    pendingResolve?.(DEFAULT_DECISION);
    pendingTimeout = null;
    pendingResolve = null;
  }
  return executeClassification(studentText, recentEntries);
}

async function executeClassification(
  studentText: string,
  recentEntries: LiveEntry[],
): Promise<RoutingDecision> {
  if (!isGeminiAvailable()) return DEFAULT_DECISION;

  const context = recentEntries.slice(-6).map((le) => {
    const e = le.entry;
    if ('content' in e) return `[${e.type}]: ${e.content}`;
    return `[${e.type}]`;
  }).join('\n');

  const prompt = `Recent conversation:\n${context || '(new conversation)'}\n\nStudent's latest entry:\n"${studentText}"\n\nClassify this entry. Return JSON only.`;

  try {
    const result = await runTextAgent(ROUTER_AGENT, [
      { role: 'user', parts: [{ text: prompt }] },
    ]);
    const cleaned = result.text
      .replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const parsed = JSON.parse(cleaned) as Record<string, unknown>;

    const decision: RoutingDecision = {
      tutor: true,
      research: Boolean(parsed.research) && !isOnCooldown('research'),
      visualize: Boolean(parsed.visualize) && !isOnCooldown('visualize'),
      illustrate: Boolean(parsed.illustrate) && !isOnCooldown('illustrate'),
      deepMemory: Boolean(parsed.deepMemory) && !isOnCooldown('deepMemory'),
      directive: Boolean(parsed.directive) && !isOnCooldown('directive'),
      graphExplore: Boolean(parsed.graphExplore),
      reason: typeof parsed.reason === 'string' ? parsed.reason : '',
      source: 'router',
    };

    if (decision.research) markUsed('research');
    if (decision.visualize) markUsed('visualize');
    if (decision.illustrate) markUsed('illustrate');
    if (decision.deepMemory) markUsed('deepMemory');
    if (decision.directive) markUsed('directive');

    return decision;
  } catch (err) {
    console.error('[Ember] Router classification error:', err);
    return DEFAULT_DECISION;
  }
}
