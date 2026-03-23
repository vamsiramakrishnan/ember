/**
 * TutorSessionState — shared reactive state between the tutor pipeline
 * and the learner's UI. This is the collaboration substrate.
 *
 * Architecture: A single in-memory store with fire-and-forget persistence
 * to IndexedDB events. The in-memory store is the fast path for React
 * subscriptions; events are the durable persistence layer.
 */

import {
  persistStudentTurn,
  persistTutorTurn,
  persistTutorActivity,
  loadSessionState,
} from './session-state-persistence';
export { setSessionIds } from './session-state-persistence';
export type {
  InteractionMode, SessionPhase, StudentFocus,
  TutorActivityStep, TutorActivityDetail,
  ActiveConcept, SessionState,
} from './session-state-types';

import type {
  InteractionMode, SessionPhase, StudentFocus,
  TutorActivityDetail, ActiveConcept, SessionState,
} from './session-state-types';

// ─── Store implementation ──────────────────────────────────

type Listener = () => void;
const listeners = new Set<Listener>();

let state: SessionState = createInitialState();

function createInitialState(): SessionState {
  return {
    phase: 'opening',
    studentTurnCount: 0,
    tutorTurnCount: 0,
    consecutiveTutorEntries: 0,
    lastTutorMode: null,
    focus: { type: 'idle', since: Date.now() },
    activeConcepts: [],
    recentStudentTypes: [],
    isThinking: false,
    isStreaming: false,
    activityDetail: null,
    coveredTopics: [],
    introducedThinkers: [],
    masterySnapshot: [],
  };
}

function emit() {
  for (const l of listeners) l();
}

// ─── Public API ────────────────────────────────────────────

/** Get the current session state (snapshot). */
export function getSessionState(): SessionState {
  return state;
}

/** Subscribe to state changes. Returns unsubscribe function. */
export function subscribeSessionState(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Reset state for a new session. */
export function resetSession(): void {
  state = createInitialState();
  emit();
}

/** Restore session state from persisted events. */
export async function restoreSession(
  notebookId: string, sessionId: string,
): Promise<void> {
  const r = await loadSessionState(notebookId, sessionId);
  if (!r) { state = createInitialState(); emit(); return; }
  state = {
    ...createInitialState(),
    phase: r.phase, studentTurnCount: r.studentTurnCount,
    tutorTurnCount: r.tutorTurnCount,
    consecutiveTutorEntries: r.consecutiveTutorEntries,
    lastTutorMode: r.lastTutorMode, coveredTopics: r.coveredTopics,
    introducedThinkers: r.introducedThinkers,
    recentStudentTypes: r.recentStudentTypes,
    activeConcepts: r.activeConcepts,
  };
  emit();
}

/** Record that a student entry was added. */
export function recordStudentTurn(entryType: string): void {
  state = {
    ...state,
    studentTurnCount: state.studentTurnCount + 1,
    consecutiveTutorEntries: 0,
    recentStudentTypes: [
      entryType,
      ...state.recentStudentTypes.slice(0, 2),
    ],
    phase: inferPhase(state.studentTurnCount + 1, state.tutorTurnCount),
  };
  emit();
  persistStudentTurn(entryType);
}

/** Record that a tutor entry was added. */
export function recordTutorTurn(
  mode: InteractionMode,
  topics: string[] = [],
  thinker?: string,
): void {
  state = {
    ...state,
    tutorTurnCount: state.tutorTurnCount + 1,
    consecutiveTutorEntries: state.consecutiveTutorEntries + 1,
    lastTutorMode: mode,
    coveredTopics: [...state.coveredTopics, ...topics],
    introducedThinkers: thinker
      ? [...state.introducedThinkers, thinker]
      : state.introducedThinkers,
    phase: inferPhase(state.studentTurnCount, state.tutorTurnCount + 1),
  };
  emit();
  persistTutorTurn(mode, topics, thinker);
}

/** Update what the student is focused on. */
export function setStudentFocus(focus: StudentFocus): void {
  state = { ...state, focus };
  emit();
}

/** Set active concepts (extracted from recent entries). */
export function setActiveConcepts(concepts: ActiveConcept[]): void {
  state = { ...state, activeConcepts: concepts };
  emit();
}

/** Update mastery snapshot (from useMasteryUpdater). */
export function setMasterySnapshot(
  snapshot: Array<{ concept: string; level: string; percentage: number }>,
): void {
  state = { ...state, masterySnapshot: snapshot };
  emit();
}

/** Set thinking/streaming state with optional granular detail. */
export function setTutorActivity(
  isThinking: boolean,
  isStreaming: boolean,
  detail?: TutorActivityDetail | null,
): void {
  state = {
    ...state,
    isThinking,
    isStreaming,
    activityDetail: detail ?? (isThinking || isStreaming ? state.activityDetail : null),
  };
  emit();
  persistTutorActivity(isThinking, isStreaming);
}

/** Update just the activity detail (doesn't change thinking/streaming flags). */
export function setActivityDetail(detail: TutorActivityDetail | null): void {
  state = { ...state, activityDetail: detail };
  emit();
}

// ─── Phase inference ───────────────────────────────────────

function inferPhase(studentCount: number, tutorCount: number): SessionPhase {
  const total = studentCount + tutorCount;
  if (total <= 4) return 'opening';
  if (studentCount < 8) return 'exploration';
  if (studentCount < 20) return 'deepening';
  return 'leaving-off';
}
