/**
 * useCollaboration — the shared tutor-learner collaboration hook.
 *
 * Replaces the scattered state management with a single event-driven
 * protocol. Both tutor and learner emit events; state is derived.
 *
 * Architecture:
 * - Events are appended to the persistent event log
 * - Session state is derived by reducing events (pure function)
 * - Entity projections are applied as events flow through
 * - The composition guard reads derived state, not mutable globals
 */
import { useCallback, useRef, useEffect, useState } from 'react';
import { useStudent } from '@/contexts/StudentContext';
import {
  appendEvent, getSessionEvents, deriveSessionState,
  type DerivedSessionState, type EventRecord,
} from '@/persistence/repositories/events';
import { applyEntityProjection } from './collaboration-projector';
import type { LiveEntry } from '@/types/entries';
import type {
  CollaborationEvent, InteractionMode, StudentFocus, EntryType,
} from '@/types/entity';

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

  const recordStudentTurn = useCallback(async (
    entryId: string, entryType: EntryType,
  ) => {
    await emit({ type: 'student-turn', entryId, entryType, timestamp: Date.now() });
    legacyRecordStudent(entryType);
  }, [emit]);

  const recordTutorTurn = useCallback(async (
    entryId: string, mode: InteractionMode, topics: string[] = [], thinker?: string,
  ) => {
    await emit({ type: 'tutor-turn', entryId, mode, topics, thinker, timestamp: Date.now() });
    legacyRecordTutor(mode, topics, thinker);
  }, [emit]);

  const setFocus = useCallback(async (focus: StudentFocus) => {
    await emit({ type: 'focus-change', focus, timestamp: Date.now() });
    legacySetFocus(focus);
  }, [emit]);

  const setTutorActivity = useCallback(async (
    isThinking: boolean, isStreaming: boolean,
  ) => {
    await emit({ type: 'tutor-thinking', isThinking, isStreaming, timestamp: Date.now() });
    legacySetTutorActivity(isThinking, isStreaming);
  }, [emit]);

  const processEntry = useCallback(async (le: LiveEntry) => {
    if (!student || !notebook) return;
    if (processedRef.current.has(le.id)) return;
    processedRef.current.add(le.id);
    await applyEntityProjection(le, student, notebook);
  }, [student, notebook]);

  const syncEntities = useCallback(async (entries: LiveEntry[]) => {
    for (const le of entries) await processEntry(le);
  }, [processEntry]);

  return {
    state, recordStudentTurn, recordTutorTurn,
    setFocus, setTutorActivity, syncEntities,
  };
}
