/**
 * Session state persistence — bridges the in-memory session store
 * to the IndexedDB event log.
 *
 * On mutations, fires-and-forgets event appends to the event store.
 * On restore, replays events to rebuild in-memory state.
 *
 * The in-memory store remains the fast path for React subscriptions.
 * Events are the durable persistence layer.
 */
import {
  appendEvent,
  getSessionEvents,
  deriveSessionState,
} from '@/persistence/repositories/events';
import type { InteractionMode } from '@/types/entity';
import type { SessionPhase } from './session-state-types';

// ─── Session tracking ────────────────────────────────────

let currentNotebookId = '';
let currentSessionId = '';

/** Set session IDs for event recording. */
export function setSessionIds(notebookId: string, sessionId: string): void {
  currentNotebookId = notebookId;
  currentSessionId = sessionId;
}

/** Get the current notebook ID for event recording. */
export function getCurrentNotebookId(): string {
  return currentNotebookId;
}

/** Get the current session ID for event recording. */
export function getCurrentSessionId(): string {
  return currentSessionId;
}

// ─── Event persistence (fire-and-forget) ─────────────────

/** Persist a student-turn event. */
export function persistStudentTurn(entryType: string): void {
  if (!currentSessionId) return;
  void appendEvent(currentNotebookId, currentSessionId, {
    type: 'student-turn',
    entryId: `student-${Date.now()}`,
    entryType: entryType as import('@/types/entity').EntryType,
    timestamp: Date.now(),
  });
}

/** Persist a tutor-turn event. */
export function persistTutorTurn(
  mode: InteractionMode,
  topics: string[],
  thinker?: string,
): void {
  if (!currentSessionId) return;
  void appendEvent(currentNotebookId, currentSessionId, {
    type: 'tutor-turn',
    entryId: `tutor-${Date.now()}`,
    mode,
    topics,
    thinker,
    timestamp: Date.now(),
  });
}

/** Persist a tutor-thinking event. */
export function persistTutorActivity(
  isThinking: boolean,
  isStreaming: boolean,
): void {
  if (!currentSessionId) return;
  void appendEvent(currentNotebookId, currentSessionId, {
    type: 'tutor-thinking',
    isThinking,
    isStreaming,
    timestamp: Date.now(),
  });
}

// ─── Restore from events ─────────────────────────────────

/** Result of restoring session state from events. */
export interface RestoredState {
  phase: SessionPhase;
  studentTurnCount: number;
  tutorTurnCount: number;
  consecutiveTutorEntries: number;
  lastTutorMode: InteractionMode | null;
  coveredTopics: string[];
  introducedThinkers: string[];
  recentStudentTypes: string[];
  activeConcepts: Array<{
    term: string;
    sourceEntryId: string;
    activatedAt: number;
  }>;
}

/**
 * Load session events and derive state.
 * Returns null if no events found (new session).
 */
export async function loadSessionState(
  notebookId: string,
  sessionId: string,
): Promise<RestoredState | null> {
  setSessionIds(notebookId, sessionId);

  const events = await getSessionEvents(sessionId);
  if (events.length === 0) return null;

  const derived = deriveSessionState(events);
  return {
    phase: derived.phase,
    studentTurnCount: derived.studentTurnCount,
    tutorTurnCount: derived.tutorTurnCount,
    consecutiveTutorEntries: derived.consecutiveTutorEntries,
    lastTutorMode: (derived.lastTutorMode as InteractionMode) ?? null,
    coveredTopics: derived.coveredTopics,
    introducedThinkers: derived.introducedThinkers,
    recentStudentTypes: derived.recentStudentTypes,
    activeConcepts: derived.activeConcepts.map((c) => ({
      term: c.term,
      sourceEntryId: c.id,
      activatedAt: Date.now(),
    })),
  };
}
