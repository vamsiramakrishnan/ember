/**
 * useCollaboration — the shared tutor-learner collaboration hook.
 *
 * Replaces the scattered state management (session-state.ts mutations,
 * useConstellationSync, useMasteryUpdater) with a single event-driven
 * protocol. Both tutor and learner emit events; state is derived.
 *
 * Architecture:
 * - Events are appended to the persistent event log
 * - Session state is derived by reducing events (pure function)
 * - Entity projections are applied as events flow through
 * - The composition guard reads derived state, not mutable globals
 *
 * The hook returns the derived state and event emitters. Components
 * consume state; the tutor pipeline emits events.
 */
import { useCallback, useRef, useEffect, useState } from 'react';
import { useStudent } from '@/contexts/StudentContext';
import {
  appendEvent,
  getSessionEvents,
  deriveSessionState,
  type DerivedSessionState,
  type EventRecord,
} from '@/persistence/repositories/events';
import { createRelation } from '@/persistence/repositories/graph';
import { upsertMastery } from '@/persistence/repositories/mastery';
import {
  createEncounter,
  getEncountersByNotebook,
} from '@/persistence/repositories/encounters';
import {
  createCuriosity,
  getCuriositiesByNotebook,
} from '@/persistence/repositories/mastery';
import { projectEntry } from '@/state/entity-projector';
import type { LiveEntry } from '@/types/entries';
import type {
  CollaborationEvent,
  InteractionMode,
  StudentFocus,
  EntryType,
} from '@/types/entity';

// Also update the legacy session-state for backward compat during migration
import {
  recordStudentTurn as legacyRecordStudent,
  recordTutorTurn as legacyRecordTutor,
  setStudentFocus as legacySetFocus,
  setTutorActivity as legacySetTutorActivity,
} from '@/state/session-state';

export interface CollaborationState extends DerivedSessionState {
  /** The full event log for this session. */
  events: EventRecord[];
}

export function useCollaboration(sessionId: string | null) {
  const { student, notebook } = useStudent();
  const [state, setState] = useState<CollaborationState>(() => ({
    ...deriveSessionState([]),
    events: [],
  }));
  const processedRef = useRef(new Set<string>());

  // Load events for current session on mount
  useEffect(() => {
    if (!sessionId) return;
    void (async () => {
      const events = await getSessionEvents(sessionId);
      const derived = deriveSessionState(events);
      setState({ ...derived, events });
    })();
  }, [sessionId]);

  const emit = useCallback(async (event: CollaborationEvent) => {
    if (!sessionId || !notebook) return;
    const record = await appendEvent(notebook.id, sessionId, event);
    setState((prev) => {
      const events = [...prev.events, record];
      return { ...deriveSessionState(events), events };
    });
  }, [sessionId, notebook]);

  // ─── Event emitters ───────────────────────────────────

  const recordStudentTurn = useCallback(async (
    entryId: string,
    entryType: EntryType,
  ) => {
    await emit({
      type: 'student-turn',
      entryId,
      entryType,
      timestamp: Date.now(),
    });
    // Legacy bridge
    legacyRecordStudent(entryType);
  }, [emit]);

  const recordTutorTurn = useCallback(async (
    entryId: string,
    mode: InteractionMode,
    topics: string[] = [],
    thinker?: string,
  ) => {
    await emit({
      type: 'tutor-turn',
      entryId,
      mode,
      topics,
      thinker,
      timestamp: Date.now(),
    });
    // Legacy bridge
    legacyRecordTutor(mode, topics, thinker);
  }, [emit]);

  const setFocus = useCallback(async (focus: StudentFocus) => {
    await emit({
      type: 'focus-change',
      focus,
      timestamp: Date.now(),
    });
    // Legacy bridge
    legacySetFocus(focus);
  }, [emit]);

  const setTutorActivity = useCallback(async (
    isThinking: boolean,
    isStreaming: boolean,
  ) => {
    await emit({
      type: 'tutor-thinking',
      isThinking,
      isStreaming,
      timestamp: Date.now(),
    });
    // Legacy bridge
    legacySetTutorActivity(isThinking, isStreaming);
  }, [emit]);

  // ─── Entity projection on new entries ─────────────────

  const processEntry = useCallback(async (le: LiveEntry) => {
    if (!student || !notebook) return;
    if (processedRef.current.has(le.id)) return;
    processedRef.current.add(le.id);

    const commands = projectEntry(le);

    for (const cmd of commands) {
      if (cmd.action !== 'create-entity') continue;

      // Apply the entity creation through existing repositories
      // (they handle deduplication)
      switch (cmd.kind) {
        case 'thinker': {
          const existing = await getEncountersByNotebook(notebook.id);
          const name = String(cmd.data.name);
          if (existing.some((e) => e.thinker.toLowerCase() === name.toLowerCase())) break;
          const encounter = await createEncounter({
            studentId: student.id,
            notebookId: notebook.id,
            ref: String(existing.length + 1).padStart(3, '0'),
            thinker: name,
            tradition: String(cmd.data.tradition ?? ''),
            coreIdea: String(cmd.data.gift ?? ''),
            sessionTopic: '',
            date: new Date().toLocaleDateString('en-GB', {
              day: 'numeric', month: 'long', year: 'numeric',
            }),
            status: 'active',
          });
          // Create graph relation: entry → thinker
          await createRelation({
            notebookId: notebook.id,
            from: cmd.sourceEntryId,
            fromKind: 'entry',
            to: encounter.id,
            toKind: 'thinker',
            type: cmd.relationToSource,
            weight: 1.0,
          });
          break;
        }

        case 'concept': {
          const mastery = await upsertMastery({
            studentId: student.id,
            notebookId: notebook.id,
            concept: String(cmd.data.term),
            level: String(cmd.data.masteryLevel) as 'exploring' | 'developing',
            percentage: Number(cmd.data.mastery),
          });
          await createRelation({
            notebookId: notebook.id,
            from: cmd.sourceEntryId,
            fromKind: 'entry',
            to: mastery.id,
            toKind: 'concept',
            type: cmd.relationToSource,
            weight: 0.8,
          });
          break;
        }

        case 'curiosity': {
          const existing = await getCuriositiesByNotebook(notebook.id);
          const q = String(cmd.data.question);
          if (existing.some((c) => c.question === q)) break;
          const curiosity = await createCuriosity({
            studentId: student.id,
            notebookId: notebook.id,
            question: q,
          });
          await createRelation({
            notebookId: notebook.id,
            from: cmd.sourceEntryId,
            fromKind: 'entry',
            to: curiosity.id,
            toKind: 'curiosity',
            type: cmd.relationToSource,
            weight: 0.6,
          });
          break;
        }
      }
    }
  }, [student, notebook]);

  /** Process a batch of entries (call after entries change). */
  const syncEntities = useCallback(async (entries: LiveEntry[]) => {
    for (const le of entries) {
      await processEntry(le);
    }
  }, [processEntry]);

  return {
    state,
    recordStudentTurn,
    recordTutorTurn,
    setFocus,
    setTutorActivity,
    syncEntities,
  };
}
