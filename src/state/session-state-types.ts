/**
 * Session state types — shared type definitions for the tutor-learner
 * collaboration substrate.
 *
 * Traces to:
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

/** Granular tutor activity — what the agent pipeline is doing right now. */
export type TutorActivityStep =
  | 'routing'         // Classifying the student's input
  | 'researching'     // Researcher agent gathering facts
  | 'thinking'        // Tutor formulating response
  | 'searching-graph' // Traversing the knowledge graph
  | 'streaming'       // Streaming text to student
  | 'visualizing'     // Generating a concept diagram or visualization
  | 'illustrating'    // Generating an illustration
  | 'reflecting'      // Generating temporal layers (echo, bridge, reflection)
  | 'refining'        // Iterating on an artifact (critique → patch)
  | 'enriching';      // Background enrichment tasks

export interface TutorActivityDetail {
  step: TutorActivityStep;
  /** Human-readable label, e.g. "Researching orbital mechanics..." */
  label: string;
  /** For multi-step processes: which iteration (e.g. refinement pass 2/3). */
  iteration?: number;
  maxIterations?: number;
}

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
  /** Granular activity — what the tutor is doing right now. */
  activityDetail: TutorActivityDetail | null;
  /** Topics the tutor has already covered this session (avoid repetition). */
  coveredTopics: string[];
  /** Thinkers already introduced this session. */
  introducedThinkers: string[];

  // ─── Mastery context ─────────────────────────────────────
  /** Quick-access mastery snapshot for the tutor's decisions. */
  masterySnapshot: Array<{ concept: string; level: string; percentage: number }>;
}
