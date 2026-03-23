/**
 * Tutor Hooks — pedagogical guardrails as declarative lifecycle hooks.
 *
 * Inspired by Claude Code's hook system. Hooks fire at key moments
 * in the tutor pipeline and can block, modify, or augment actions.
 *
 * Hook types:
 * - pre-response: Before the tutor responds (can block or modify)
 * - post-response: After the tutor responds (update student model)
 * - pre-enrichment: Before visualization/illustration (can skip)
 * - post-enrichment: After enrichment completes
 * - session-end: Before session closes (ensure closing reflection)
 *
 * Hooks return a verdict: allow, block (with reason), or modify.
 */
import { getSessionState } from '@/state';
import type { NotebookEntry } from '@/types/entries';
import type { RoutingDecision } from './router-agent';

// ─── Hook types ──────────────────────────────────────────────

export type HookPhase =
  | 'pre-response'
  | 'post-response'
  | 'pre-enrichment'
  | 'post-enrichment'
  | 'session-end';

export interface HookContext {
  phase: HookPhase;
  studentText: string;
  routing: RoutingDecision;
  entries: NotebookEntry[];
}

export type HookVerdict =
  | { action: 'allow' }
  | { action: 'block'; reason: string }
  | { action: 'modify'; overrides: Partial<RoutingDecision> };

export type HookFn = (ctx: HookContext) => HookVerdict;

// ─── Hook registry ───────────────────────────────────────────

const hooks: Map<HookPhase, HookFn[]> = new Map();

export function registerHook(phase: HookPhase, fn: HookFn): () => void {
  const list = hooks.get(phase) ?? [];
  list.push(fn);
  hooks.set(phase, list);
  return () => {
    const idx = list.indexOf(fn);
    if (idx >= 0) list.splice(idx, 1);
  };
}

/** Run all hooks for a phase. First block wins. Modifications accumulate. */
export function runHooks(ctx: HookContext): HookVerdict {
  const list = hooks.get(ctx.phase) ?? [];
  let overrides: Partial<RoutingDecision> = {};

  for (const fn of list) {
    const verdict = fn(ctx);
    if (verdict.action === 'block') return verdict;
    if (verdict.action === 'modify') {
      overrides = { ...overrides, ...verdict.overrides };
    }
  }

  if (Object.keys(overrides).length > 0) {
    return { action: 'modify', overrides };
  }
  return { action: 'allow' };
}

// ─── Built-in pedagogical hooks ──────────────────────────────

/** Don't overwhelm the student with too much enrichment at once. */
export const quietDownHook: HookFn = () => {
  const session = getSessionState();
  if (session.consecutiveTutorEntries >= 3) {
    return {
      action: 'modify',
      overrides: { visualize: false, illustrate: false, directive: false },
    };
  }
  return { action: 'allow' };
};

/** During opening phase, keep it simple — no enrichment. */
export const openingPhaseHook: HookFn = () => {
  const session = getSessionState();
  if (session.phase === 'opening') {
    return {
      action: 'modify',
      overrides: {
        research: false, visualize: false,
        illustrate: false, directive: false,
      },
    };
  }
  return { action: 'allow' };
};

/** Ensure closing reflection before session end. */
export const closingReflectionHook: HookFn = (ctx) => {
  if (ctx.phase !== 'session-end') return { action: 'allow' };
  const session = getSessionState();
  const hasReflection = ctx.entries.some((e) => e.type === 'tutor-reflection');
  if (session.studentTurnCount > 5 && !hasReflection) {
    return { action: 'block', reason: 'Session needs a closing reflection first' };
  }
  return { action: 'allow' };
};

/** Register all built-in hooks. Call once at app startup. */
export function registerBuiltInHooks(): void {
  registerHook('pre-enrichment', quietDownHook);
  registerHook('pre-enrichment', openingPhaseHook);
  registerHook('session-end', closingReflectionHook);
}
