/**
 * Routing Chain — composable strategy chain (cheap checks first).
 * Inspired by Gemini CLI's ModelRouterService.
 */
import { getSessionState } from '@/state';
import type { RoutingDecision } from './router-agent';
import type { LiveEntry } from '@/types/entries';

/** A routing strategy returns a partial decision or null to pass. */
export interface RoutingStrategy {
  name: string;
  evaluate(ctx: RoutingContext): RoutingOverride | null;
}

export interface RoutingContext {
  studentText: string;
  recentEntries: LiveEntry[];
  /** Pre-computed by the chain before strategies run. */
  wordCount: number;
  hasQuestion: boolean;
  mentionsConcept: boolean;
}

/** Partial override — only the fields that this strategy is certain about. */
export interface RoutingOverride {
  source: string;
  /** Fields to force. Unset fields are left to later strategies. */
  research?: boolean;
  visualize?: boolean;
  illustrate?: boolean;
  deepMemory?: boolean;
  directive?: boolean;
  /** If true, skip all remaining strategies. */
  terminal?: boolean;
  reason?: string;
}

// ─── Strategies ──────────────────────────────────────────────

/** Skip agents that are on cooldown — no point asking the LLM. */
export function createCooldownStrategy(
  isOnCooldown: (agent: string) => boolean,
): RoutingStrategy {
  return {
    name: 'cooldown',
    evaluate() {
      const overrides: RoutingOverride = { source: 'cooldown' };
      if (isOnCooldown('research')) overrides.research = false;
      if (isOnCooldown('visualize')) overrides.visualize = false;
      if (isOnCooldown('illustrate')) overrides.illustrate = false;
      if (isOnCooldown('deepMemory')) overrides.deepMemory = false;
      if (isOnCooldown('directive')) overrides.directive = false;
      return overrides;
    },
  };
}

/** Simple heuristic patterns — avoid LLM call for obvious cases. */
export const heuristicStrategy: RoutingStrategy = {
  name: 'heuristic',
  evaluate(ctx) {
    // Very short input (< 5 words) → tutor only, skip everything
    if (ctx.wordCount < 5 && !ctx.hasQuestion) {
      return {
        source: 'heuristic',
        research: false, visualize: false, illustrate: false,
        deepMemory: false, directive: false,
        terminal: true,
        reason: 'Short input — tutor only',
      };
    }
    return null;
  },
};

/** Check student model state — don't interrupt deep thinking. */
export const studentModelStrategy: RoutingStrategy = {
  name: 'student-model',
  evaluate() {
    const session = getSessionState();
    // During opening phase, don't trigger expensive agents
    if (session.phase === 'opening' && session.studentTurnCount < 2) {
      return {
        source: 'student-model',
        research: false, visualize: false, illustrate: false,
        directive: false,
        reason: 'Opening phase — tutor only',
      };
    }
    // If 3+ consecutive tutor entries, don't add more enrichment
    if (session.consecutiveTutorEntries >= 3) {
      return {
        source: 'student-model',
        visualize: false, illustrate: false, directive: false,
        reason: 'Too many consecutive tutor entries — quiet down',
      };
    }
    return null;
  },
};

// ─── Chain runner ─────────────────────────────────────────────

/** Run the strategy chain, accumulating overrides. */
export function runStrategyChain(
  strategies: RoutingStrategy[],
  ctx: RoutingContext,
): { overrides: RoutingOverride[]; skippedLLM: boolean } {
  const overrides: RoutingOverride[] = [];
  let skippedLLM = false;

  for (const strategy of strategies) {
    const result = strategy.evaluate(ctx);
    if (result) {
      overrides.push(result);
      if (result.terminal) {
        skippedLLM = true;
        break;
      }
    }
  }

  return { overrides, skippedLLM };
}

/** Apply accumulated overrides to an LLM routing decision. */
export function applyOverrides(
  decision: RoutingDecision, overrides: RoutingOverride[],
): RoutingDecision {
  let r = { ...decision };
  for (const o of overrides) {
    if (o.research !== undefined) r.research = o.research;
    if (o.visualize !== undefined) r.visualize = o.visualize;
    if (o.illustrate !== undefined) r.illustrate = o.illustrate;
    if (o.deepMemory !== undefined) r.deepMemory = o.deepMemory;
    if (o.directive !== undefined) r.directive = o.directive;
    if (o.reason) { r.reason = o.reason; r.source = 'router'; }
  }
  return r;
}

/** Build a routing context from raw inputs. */
export function buildRoutingContext(
  studentText: string, recentEntries: LiveEntry[],
): RoutingContext {
  const wordCount = studentText.split(/\s+/).length;
  return { studentText, recentEntries, wordCount,
    hasQuestion: /\?/.test(studentText), mentionsConcept: /@\[/.test(studentText) };
}
