/**
 * useDirectiveCompletion — marks tutor directives as complete and
 * signals the mastery system that the student engaged with the material.
 *
 * When a student marks a directive complete (e.g., "I searched for
 * Euler's identity"), the hook:
 * 1. Updates the entry by patching it with completed/completedAt
 * 2. Creates a synthetic mastery signal — completing a directive shows
 *    deeper engagement than passive reading
 * 3. Persists a session event for the learning intelligence system
 *
 * Directive types map to engagement levels:
 * - "search" / "read" → moderate engagement (exploring → developing)
 * - "try" / "observe" → high engagement (developing → strong)
 * - "compare" → highest engagement (requires synthesis)
 */
import { useCallback } from 'react';
import { updateMasteryFromEntry } from '@/services/background-tasks';
import { getMasteryByNotebook } from '@/persistence/repositories/mastery';
import { appendEvent } from '@/persistence/repositories/events';
import { useStudent } from '@/contexts/StudentContext';
import {
  getCurrentNotebookId,
  getCurrentSessionId,
} from '@/state/session-state-persistence';
import type { NotebookEntry } from '@/types/entries';

interface DirectiveCompletionDeps {
  patchEntry: (id: string, entry: NotebookEntry) => void;
}

export function useDirectiveCompletion({ patchEntry }: DirectiveCompletionDeps) {
  const { student, notebook } = useStudent();

  const completeDirective = useCallback(async (
    entryId: string,
    content: string,
    action?: string,
  ) => {
    const now = Date.now();

    // 1. Update the entry itself — pass the full updated entry
    patchEntry(entryId, {
      type: 'tutor-directive',
      content,
      action,
      completed: true,
      completedAt: now,
    });

    // 2. Signal mastery system — directive completion is strong engagement
    if (student && notebook) {
      const mastery = await getMasteryByNotebook(notebook.id);
      const masteryStr = mastery.length > 0
        ? mastery.map((m) => `${m.concept}: ${m.level} (${m.percentage}%)`).join('\n')
        : 'No mastery data yet';

      const engagementText = [
        `The student completed a tutor directive (${action ?? 'general'}).`,
        `Directive: "${content.slice(0, 200)}"`,
        'This demonstrates active engagement with the material beyond the notebook.',
        action === 'try' || action === 'observe'
          ? 'Hands-on experiential learning — strong mastery signal.'
          : action === 'compare'
            ? 'Comparative analysis — synthesis-level engagement.'
            : 'Research or reading engagement — developing mastery signal.',
      ].join(' ');

      void updateMasteryFromEntry(
        engagementText, masteryStr, student.id, notebook.id,
      );

      // 3. Persist session event for learning intelligence
      const notebookId = getCurrentNotebookId();
      const sessionId = getCurrentSessionId();
      if (notebookId && sessionId) {
        void appendEvent(notebookId, sessionId, {
          type: 'directive-completed',
          action: action ?? 'general',
          content: content.slice(0, 200),
          timestamp: now,
        });
      }
    }
  }, [student, notebook, patchEntry]);

  return { completeDirective };
}
