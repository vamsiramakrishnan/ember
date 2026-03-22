/**
 * Event repository — append-only collaboration event log.
 *
 * Events are the shared substrate between tutor and learner.
 * Instead of mutating session state directly, both sides append
 * events. Session state is derived by reducing events.
 *
 * This enables:
 * - Replay: rebuild any session state from events
 * - Debugging: inspect what happened and when
 * - Sync: events are the unit of replication
 * - Analysis: compute mastery trajectories, rhythm patterns
 */
import { put, getByIndex } from '../engine';
import { notify } from '../emitter';
import { recordOp } from '../sync/oplog';
import { createId } from '../ids';
import { Store } from '../schema';
import type { CollaborationEvent, SessionPhase } from '@/types/entity';

const STORE = Store.Events;

interface EventRecord {
  id: string;
  notebookId: string;
  sessionId: string;
  event: CollaborationEvent;
  timestamp: number;
}

// ─── Write ────────────────────────────────────────────────

/** Append a collaboration event. */
export async function appendEvent(
  notebookId: string,
  sessionId: string,
  event: CollaborationEvent,
): Promise<EventRecord> {
  const record: EventRecord = {
    id: createId(),
    notebookId,
    sessionId,
    event,
    timestamp: event.timestamp,
  };
  await put(STORE, record);
  notify(STORE);
  await recordOp(STORE, 'put', record.id, record);
  return record;
}

// ─── Query ────────────────────────────────────────────────

/** Get all events for a session, ordered by timestamp. */
export async function getSessionEvents(
  sessionId: string,
): Promise<EventRecord[]> {
  const events = await getByIndex<EventRecord>(
    STORE, 'by-session', sessionId,
  );
  return events.sort((a, b) => a.timestamp - b.timestamp);
}

/** Get all events for a notebook. */
export async function getNotebookEvents(
  notebookId: string,
): Promise<EventRecord[]> {
  const events = await getByIndex<EventRecord>(
    STORE, 'by-notebook', notebookId,
  );
  return events.sort((a, b) => a.timestamp - b.timestamp);
}

/** Get events of a specific type. */
export async function getEventsByType(
  type: CollaborationEvent['type'],
): Promise<EventRecord[]> {
  return getByIndex<EventRecord>(STORE, 'by-type', type);
}

// ─── Derived state ────────────────────────────────────────

/**
 * Reduce session events into derived session state.
 *
 * This replaces the mutable session-state.ts store. Instead of
 * ad-hoc mutations, we fold over the event log to compute state.
 * Pure function — no side effects, fully testable.
 */
export interface DerivedSessionState {
  phase: SessionPhase;
  studentTurnCount: number;
  tutorTurnCount: number;
  consecutiveTutorEntries: number;
  lastTutorMode: string | null;
  isThinking: boolean;
  isStreaming: boolean;
  coveredTopics: string[];
  introducedThinkers: string[];
  activeConcepts: Array<{ id: string; term: string }>;
  recentStudentTypes: string[];
}

/** Compute session state from event log. Pure reduction. */
export function deriveSessionState(
  events: EventRecord[],
): DerivedSessionState {
  const state: DerivedSessionState = {
    phase: 'opening',
    studentTurnCount: 0,
    tutorTurnCount: 0,
    consecutiveTutorEntries: 0,
    lastTutorMode: null,
    isThinking: false,
    isStreaming: false,
    coveredTopics: [],
    introducedThinkers: [],
    activeConcepts: [],
    recentStudentTypes: [],
  };

  for (const { event } of events) {
    switch (event.type) {
      case 'student-turn':
        state.studentTurnCount++;
        state.consecutiveTutorEntries = 0;
        state.recentStudentTypes = [
          event.entryType,
          ...state.recentStudentTypes.slice(0, 2),
        ];
        state.phase = inferPhase(
          state.studentTurnCount, state.tutorTurnCount,
        );
        break;

      case 'tutor-turn':
        state.tutorTurnCount++;
        state.consecutiveTutorEntries++;
        state.lastTutorMode = event.mode;
        state.coveredTopics.push(...event.topics);
        if (event.thinker) {
          state.introducedThinkers.push(event.thinker);
        }
        state.phase = inferPhase(
          state.studentTurnCount, state.tutorTurnCount,
        );
        break;

      case 'tutor-thinking':
        state.isThinking = event.isThinking;
        state.isStreaming = event.isStreaming;
        break;

      case 'concept-activated':
        if (!state.activeConcepts.some((c) => c.id === event.conceptId)) {
          state.activeConcepts.push({
            id: event.conceptId,
            term: event.term,
          });
        }
        break;

      case 'concept-deactivated':
        state.activeConcepts = state.activeConcepts.filter(
          (c) => c.id !== event.conceptId,
        );
        break;

      case 'session-phase-change':
        state.phase = event.phase;
        break;
    }
  }

  return state;
}

function inferPhase(
  studentCount: number,
  tutorCount: number,
): SessionPhase {
  const total = studentCount + tutorCount;
  if (total <= 4) return 'opening';
  if (studentCount < 8) return 'exploration';
  if (studentCount < 20) return 'deepening';
  return 'leaving-off';
}

export type { EventRecord };
