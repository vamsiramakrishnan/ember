/**
 * Entity — the atomic unit of Ember's knowledge graph.
 *
 * Design principle: Every piece of knowledge is an entity. Every
 * connection between pieces is a relation. No nesting, no embedding,
 * no if-then-else to extract structure. Entities are atoms; relations
 * are bonds. The graph is the molecule.
 *
 * An entity is:
 * - Typed (discriminated union — exhaustive, no string-matching)
 * - Addressable (globally unique ID)
 * - Scoped (belongs to a notebook)
 * - Timestamped (created, updated — for ordering and sync)
 * - Authorable (student or tutor — for collaboration)
 *
 * Relations are first-class. They are entities themselves, stored
 * in IndexedDB, queryable by type, traversable in both directions.
 * The in-memory graph is a cache; persistence is the source of truth.
 */

import type { NotebookEntry } from './entries';
import type { MasteryLevel } from './mastery';
export type { MasteryLevel } from './mastery';

// ─── Entity base ──────────────────────────────────────────

export interface EntityMeta {
  id: string;
  notebookId: string;
  /** Who created this entity. */
  author: 'student' | 'tutor' | 'system';
  createdAt: number;
  updatedAt: number;
}

// ─── Entity kinds ─────────────────────────────────────────

/** A concept the student is learning. Atomic — one concept, one entity. */
export interface ConceptEntity extends EntityMeta {
  kind: 'concept';
  term: string;
  /** Mastery percentage 0–100. Single source of truth. */
  mastery: number;
  /** Where mastery falls: exploring < developing < strong < mastered. */
  masteryLevel: MasteryLevel;
}

/** A vocabulary term in the student's personal lexicon. */
export interface TermEntity extends EntityMeta {
  kind: 'term';
  term: string;
  pronunciation: string;
  definition: string;
  etymology: string;
  mastery: number;
  masteryLevel: MasteryLevel;
}

/** A thinker the student has encountered. */
export interface ThinkerEntity extends EntityMeta {
  kind: 'thinker';
  name: string;
  dates: string;
  tradition: string;
  gift: string;
  /** How active this encounter is in the student's exploration. */
  status: 'active' | 'dormant' | 'bridged';
}

/** A primary text being studied. */
export interface TextEntity extends EntityMeta {
  kind: 'text';
  title: string;
  textAuthor: string;
  isCurrent: boolean;
  annotationCount: number;
  quote: string;
}

/** A question the student is curious about — an open thread. */
export interface CuriosityEntity extends EntityMeta {
  kind: 'curiosity';
  question: string;
  /** Whether the thread has been explored or is still open. */
  resolved: boolean;
}

/** A session — a bounded period of student-tutor dialogue. */
export interface SessionEntity extends EntityMeta {
  kind: 'session';
  number: number;
  date: string;
  timeOfDay: string;
  topic: string;
}

/** A notebook entry — the atomic content block. */
export interface EntryEntity extends EntityMeta {
  kind: 'entry';
  sessionId: string;
  order: number;
  entryType: EntryType;
  content: EntryContent;
  crossedOut: boolean;
  bookmarked: boolean;
  pinned: boolean;
  blobHash?: string;
}

/** The discriminated union of all entity kinds. */
export type Entity =
  | ConceptEntity
  | TermEntity
  | ThinkerEntity
  | TextEntity
  | CuriosityEntity
  | SessionEntity
  | EntryEntity;

export type EntityKind = Entity['kind'];

// ─── Entry content types ──────────────────────────────────
// Flat discriminated union — no nesting.

export type EntryType =
  | 'prose' | 'scratch' | 'hypothesis' | 'question' | 'sketch'
  | 'tutor-marginalia' | 'tutor-question' | 'tutor-connection'
  | 'concept-diagram' | 'thinker-card'
  | 'code-cell' | 'image' | 'file-upload' | 'embed' | 'document'
  | 'visualization' | 'illustration'
  | 'silence' | 'divider' | 'echo' | 'bridge-suggestion'
  | 'tutor-reflection' | 'tutor-directive' | 'citation'
  | 'streaming-text';

export type EntryContent = NotebookEntry;

// ─── Relations ────────────────────────────────────────────

/**
 * A relation is a typed, directed edge between two entities.
 * Relations are first-class — persisted, indexed, queryable.
 *
 * The relation type determines the semantics:
 * - Structural: session-contains, notebook-contains
 * - Conversational: prompted-by, follow-up, extends, confirms, contradicts
 * - Knowledge: introduces (entry → thinker), defines (entry → term),
 *   explores (entry → concept), references (entry → text)
 * - Bridging: bridges-to (concept → concept, thinker → thinker)
 * - Temporal: echoes (current → past entry)
 */
export interface Relation {
  id: string;
  notebookId: string;
  /** Source entity ID. */
  from: string;
  /** Source entity kind (denormalized for query efficiency). */
  fromKind: EntityKind;
  /** Target entity ID. */
  to: string;
  /** Target entity kind (denormalized for query efficiency). */
  toKind: EntityKind;
  type: RelationType;
  /** Optional metadata — e.g., the span of text that prompted the relation. */
  meta?: string;
  /** Strength or weight — for graph ranking. 0–1. */
  weight: number;
  createdAt: number;
}

export type RelationType =
  // Structural
  | 'session-contains'   // session → entry
  | 'notebook-contains'  // notebook → session | concept | thinker | term | text
  // Conversational
  | 'prompted-by'        // entry → entry (tutor response prompted by student)
  | 'follow-up'          // entry → entry
  | 'extends'            // entry → entry (deepening)
  | 'confirms'           // entry → entry (tutor confirms hypothesis)
  | 'contradicts'        // entry → entry
  | 'echoes'             // entry → entry (referencing past thought)
  | 'branches-from'      // entry → entry (new direction)
  // Knowledge graph
  | 'introduces'         // entry → thinker | concept | term
  | 'defines'            // entry → term
  | 'explores'           // entry → concept
  | 'references'         // entry → text | thinker | concept
  | 'bridges-to'         // concept → concept, thinker → thinker
  | 'cross-references'   // term → term
  // Annotation
  | 'annotates';         // annotation entry → target entry

// ─── Annotations ──────────────────────────────────────────

/** Annotations are lightweight — stored inline on entry entities. */
export interface Annotation {
  id: string;
  author: 'student' | 'tutor';
  content: string;
  timestamp: number;
  spanStart?: number;
  spanEnd?: number;
  kind?: 'insight' | 'trivia' | 'question' | 'connection' | 'correction';
  /** If this annotation was prompted by another entity. */
  sourceEntityId?: string;
}

// ─── Collaboration events ─────────────────────────────────

/**
 * A collaboration event is an atomic record of something that
 * happened during a session. Events are the shared substrate
 * between tutor and learner — both produce and consume them.
 *
 * Events replace the ad-hoc session state mutations (recordStudentTurn,
 * recordTutorTurn, etc.) with a single, appendable, replayable log.
 */
export type CollaborationEvent =
  | { type: 'student-turn'; entryId: string; entryType: EntryType; timestamp: number }
  | { type: 'tutor-turn'; entryId: string; mode: InteractionMode; topics: string[]; thinker?: string; timestamp: number }
  | { type: 'focus-change'; focus: StudentFocus; timestamp: number }
  | { type: 'concept-activated'; conceptId: string; term: string; timestamp: number }
  | { type: 'concept-deactivated'; conceptId: string; timestamp: number }
  | { type: 'mastery-updated'; conceptId: string; from: number; to: number; timestamp: number }
  | { type: 'tutor-thinking'; isThinking: boolean; isStreaming: boolean; timestamp: number }
  | { type: 'session-phase-change'; phase: SessionPhase; timestamp: number };

export type InteractionMode =
  | 'connection' | 'socratic' | 'confirmation' | 'visual' | 'silence';

export type SessionPhase =
  | 'opening' | 'exploration' | 'deepening' | 'leaving-off';

export type StudentFocus =
  | { type: 'writing' }
  | { type: 'reading'; entryId: string }
  | { type: 'idle'; since: number }
  | { type: 'canvas' }
  | { type: 'constellation'; view: string };
