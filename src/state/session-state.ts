/**
 * TutorSessionState — shared reactive state between the tutor pipeline
 * and the learner's UI. This is the collaboration substrate.
 *
 * Eigen principle: The student and tutor share a world model, not just
 * a message stream. The tutor knows what the student is looking at,
 * what concepts are in play, and what rhythm the session is in.
 *
 * Architecture: A single in-memory store (not IndexedDB) that both
 * the tutor hooks and the UI components subscribe to. Changes propagate
 * via React's useSyncExternalStore for zero-overhead subscriptions.
 *
 * Traces to:
 * - Principle I  (Tutor Never Answers First): focus tracking
 * - Principle III (Mastery is Invisible): mastery snapshot
 * - Principle VI  (Silence is a Feature): session phase tracking
 * - 03-interaction-language.md: five interaction modes
 * - 07-compositional-grammar.md: voice alternation
 */

/** The five interaction modes from the spec. */
export type InteractionMode =
  | 'connection'       // Drawing lines between interests
  | 'socratic'         // Genuine question
  | 'confirmation'     // "Right, and..." extension
  | 'visual'           // Diagram or sketch
  | 'silence';         // Waiting

/** Session phases from the interaction language spec. */
export type SessionPhase =
  | 'opening'          // 1-3 tutor entries max, establishing connection
  | 'exploration'      // Student-heavy, alternating turns
  | 'deepening'        // Harder questions, longer silence, mastery edge
  | 'leaving-off';     // No summary, threads left open

/** What the student is currently doing. */
export type StudentFocus =
  | { type: 'writing' }
  | { type: 'reading'; entryId: string }
  | { type: 'idle'; since: number }
  | { type: 'canvas' }
  | { type: 'constellation'; view: string };

/** Concept currently "in play" — mentioned or being explored. */
export interface ActiveConcept {
  term: string;
  /** Entry that introduced or last referenced this concept. */
  sourceEntryId: string;
  /** When it entered the active set. */
  activatedAt: number;
}

/** The full shared state. */
export interface SessionState {
  // ─── Session rhythm ──────────────────────────────────────
  phase: SessionPhase;
  /** Count of student entries in this session. */
  studentTurnCount: number;
  /** Count of tutor entries in this session. */
  tutorTurnCount: number;
  /** Count of consecutive tutor entries (for voice alternation). */
  consecutiveTutorEntries: number;
  /** The last interaction mode the tutor used. */
  lastTutorMode: InteractionMode | null;

  // ─── Student awareness ──────────────────────────────────
  focus: StudentFocus;
  /** Concepts currently "in play" (mentioned in recent entries). */
  activeConcepts: ActiveConcept[];
  /** The student's last 3 entry types (for pattern detection). */
  recentStudentTypes: string[];

  // ─── Tutor state ─────────────────────────────────────────
  isThinking: boolean;
  isStreaming: boolean;
  /** Topics the tutor has already covered this session (avoid repetition). */
  coveredTopics: string[];
  /** Thinkers already introduced this session. */
  introducedThinkers: string[];

  // ─── Mastery context ─────────────────────────────────────
  /** Quick-access mastery snapshot for the tutor's decisions. */
  masterySnapshot: Array<{ concept: string; level: string; percentage: number }>;
}

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

/** Set thinking/streaming state. */
export function setTutorActivity(
  isThinking: boolean,
  isStreaming: boolean,
): void {
  state = { ...state, isThinking, isStreaming };
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
