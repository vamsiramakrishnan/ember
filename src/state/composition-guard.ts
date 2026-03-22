/**
 * CompositionGuard — enforces the compositional grammar from the spec.
 *
 * Eigen principle: The notebook has a rhythm. Student and tutor alternate
 * like voices in a conversation. The tutor never dominates. Silence is
 * permitted. Three consecutive tutor entries are never permitted.
 *
 * This guard is consulted BEFORE adding tutor entries. It returns
 * a verdict: emit, defer, or suppress. The orchestrator must obey.
 *
 * Traces to:
 * - 07-compositional-grammar.md: "No three consecutive tutor elements"
 * - Principle I: "The tutor never answers first"
 * - Principle VI: "Silence is a feature" (guards silence timing)
 * - 03-interaction-language.md: session rhythm
 */

import type { NotebookEntry, LiveEntry } from '@/types/entries';
import { getSessionState } from './session-state';

/** Verdict from the composition guard. */
export type GuardVerdict =
  | { action: 'emit' }
  | { action: 'defer'; reason: string; delayMs: number }
  | { action: 'suppress'; reason: string };

const TUTOR_ENTRY_TYPES = new Set([
  'tutor-marginalia', 'tutor-question', 'tutor-connection',
  'tutor-reflection', 'tutor-directive', 'thinker-card',
  'concept-diagram', 'visualization', 'illustration',
]);

const SYSTEM_TYPES = new Set([
  'silence', 'divider', 'echo', 'bridge-suggestion',
  'citation', 'streaming-text',
]);

function isTutorEntry(type: string): boolean {
  return TUTOR_ENTRY_TYPES.has(type);
}

/**
 * Check whether a tutor entry should be emitted, deferred, or suppressed.
 *
 * Rules enforced:
 * 1. Max 2 consecutive tutor entries (3rd is deferred or suppressed)
 * 2. No duplicate thinker introductions in the same session
 * 3. Echoes only after 5+ entries since last echo
 * 4. Reflections only after 10+ entries since last reflection
 * 5. Bridge suggestions only once per session
 * 6. Opening phase: max 3 tutor entries total
 */
export function checkComposition(
  proposed: NotebookEntry,
  recentEntries: LiveEntry[],
): GuardVerdict {
  const session = getSessionState();

  // System entries (silence, divider, citation) always pass
  if (SYSTEM_TYPES.has(proposed.type)) {
    return { action: 'emit' };
  }

  // Rule 1: Voice alternation — no three consecutive tutor entries
  if (isTutorEntry(proposed.type) && session.consecutiveTutorEntries >= 2) {
    return {
      action: 'defer',
      reason: 'Voice alternation: waiting for student turn before third tutor entry',
      delayMs: 0, // Defer indefinitely until student speaks
    };
  }

  // Rule 2: No duplicate thinker introductions
  if (proposed.type === 'thinker-card') {
    const thinkerName = proposed.thinker.name.toLowerCase();
    if (session.introducedThinkers.some(
      (t) => t.toLowerCase() === thinkerName,
    )) {
      return {
        action: 'suppress',
        reason: `Thinker "${proposed.thinker.name}" already introduced this session`,
      };
    }
  }

  // Rule 3: Echo spacing — at least 5 entries since last echo
  if (proposed.type === 'echo') {
    const lastEchoIndex = findLastIndex(
      recentEntries, (e) => e.entry.type === 'echo',
    );
    if (lastEchoIndex >= 0 && recentEntries.length - lastEchoIndex < 5) {
      return {
        action: 'suppress',
        reason: 'Echo spacing: fewer than 5 entries since last echo',
      };
    }
  }

  // Rule 4: Reflection spacing — at least 10 entries since last
  if (proposed.type === 'tutor-reflection') {
    const lastReflIndex = findLastIndex(
      recentEntries, (e) => e.entry.type === 'tutor-reflection',
    );
    if (lastReflIndex >= 0 && recentEntries.length - lastReflIndex < 10) {
      return {
        action: 'suppress',
        reason: 'Reflection spacing: fewer than 10 entries since last reflection',
      };
    }
  }

  // Rule 5: Bridge suggestions — max one per session
  if (proposed.type === 'bridge-suggestion') {
    const hasBridge = recentEntries.some(
      (e) => e.entry.type === 'bridge-suggestion',
    );
    if (hasBridge) {
      return {
        action: 'suppress',
        reason: 'Bridge suggestion already issued this session',
      };
    }
  }

  // Rule 6: Opening phase — limit tutor output
  if (session.phase === 'opening' && session.tutorTurnCount >= 3) {
    if (isTutorEntry(proposed.type)) {
      return {
        action: 'defer',
        reason: 'Opening phase: max 3 tutor entries reached, wait for exploration',
        delayMs: 0,
      };
    }
  }

  return { action: 'emit' };
}

/**
 * Filter a list of proposed tutor entries through the composition guard.
 * Returns only the entries that should be emitted, in order.
 * Logs suppressions/deferrals for debugging.
 */
export function filterByComposition(
  proposed: NotebookEntry[],
  currentEntries: LiveEntry[],
): NotebookEntry[] {
  const result: NotebookEntry[] = [];

  for (const entry of proposed) {
    const verdict = checkComposition(entry, currentEntries);
    switch (verdict.action) {
      case 'emit':
        result.push(entry);
        break;
      case 'defer':
        if (import.meta.env.DEV) {
          console.info('[CompositionGuard] Deferred:', verdict.reason);
        }
        break;
      case 'suppress':
        if (import.meta.env.DEV) {
          console.info('[CompositionGuard] Suppressed:', verdict.reason);
        }
        break;
    }
  }

  return result;
}

// ─── Utility ───────────────────────────────────────────────

function findLastIndex<T>(arr: T[], pred: (item: T) => boolean): number {
  for (let i = arr.length - 1; i >= 0; i--) {
    if (pred(arr[i]!)) return i;
  }
  return -1;
}
