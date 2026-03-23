/**
 * tutor-helpers — pure utility functions used by useGeminiTutor.
 *
 * Extracted to enforce the 150-line file limit.
 * Contains: delay, inferTutorMode, extractTopics, executeDeferredAction.
 */
import type { DeferredAction } from '@/services/tool-executor';
import type { InteractionMode } from '@/state';
import type { NotebookEntry } from '@/types/entries';

/** Promise-based delay for staggering tutor entry reveals. */
export function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** Infer the interaction mode from a tutor entry type. */
export function inferTutorMode(entry: NotebookEntry): InteractionMode {
  switch (entry.type) {
    case 'tutor-question': return 'socratic';
    case 'tutor-connection': return 'connection';
    case 'concept-diagram':
    case 'visualization':
    case 'illustration': return 'visual';
    case 'silence': return 'silence';
    default: return 'confirmation';
  }
}

/** Extract topic keywords from a tutor entry. */
export function extractTopics(entry: NotebookEntry): string[] {
  if (!('content' in entry) || typeof entry.content !== 'string') return [];
  const matches = entry.content.match(
    /\b[A-Z][a-z]+(?:\s+[a-z]+){0,2}\b/g,
  ) ?? [];
  return matches.slice(0, 3);
}

/** Lazily import and execute a deferred action (mastery update, graph write, etc.). */
export function executeDeferredAction(
  action: DeferredAction | import('@/services/graph-tools').GraphDeferredAction,
  studentId: string,
  notebookId: string,
): void {
  void import('@/services/deferred-executor').then(({ executeDeferredAction: execute }) => {
    execute(action, studentId, notebookId);
  });
}
