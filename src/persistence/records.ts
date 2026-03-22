/**
 * Persisted record types — the shapes stored in IndexedDB.
 * Every domain record carries a studentId for multi-student isolation.
 * Entries inherit student context through their sessionId.
 */
import type { NotebookEntry } from '@/types/entries';
import type { MasteryLevel } from '@/types/mastery';
import type { CanvasPosition, CanvasConnection } from '@/types/canvas';

/** Every record carries identity and time. */
interface BaseRecord {
  id: string;
  createdAt: number;
  updatedAt: number;
}

/** The student — top-level identity. Everything belongs to a student. */
export interface StudentRecord extends BaseRecord {
  name: string;
  /** How the student prefers to be addressed. */
  displayName: string;
  /** Avatar seed — used to generate a deterministic warm-toned avatar. */
  avatarSeed: string;
  /** Total time across all sessions, in minutes. */
  totalMinutes: number;
}

/** A notebook is a named collection of sessions (e.g. "Music & Mathematics"). */
export interface NotebookRecord extends BaseRecord {
  studentId: string;
  title: string;
  /** Short description or guiding question. */
  description: string;
  /** Number of sessions in this notebook. */
  sessionCount: number;
  /** Whether this is the currently active notebook. */
  isActive: boolean;
  /** AI-generated icon (base64 data URL, 64x64 PNG). */
  iconDataUrl?: string;
  /** AI-generated tags for categorisation. */
  tags?: string[];
  /** AI-generated one-line summary of the exploration so far. */
  summary?: string;
  /** Primary discipline detected by AI (e.g. "mathematics", "philosophy"). */
  discipline?: string;
}

export interface SessionRecord extends BaseRecord {
  studentId: string;
  notebookId: string;
  number: number;
  date: string;
  timeOfDay: string;
  topic: string;
}

export interface EntryRecord extends BaseRecord {
  sessionId: string;
  order: number;
  type: NotebookEntry['type'];
  entry: NotebookEntry;
  crossedOut: boolean;
  bookmarked: boolean;
  pinned: boolean;
  blobHash?: string;
  /** Annotations from student and tutor on this entry. */
  annotations?: import('@/types/entries').EntryAnnotation[];
}

export interface LexiconRecord extends BaseRecord {
  studentId: string;
  notebookId: string;
  number: number;
  term: string;
  pronunciation: string;
  definition: string;
  level: MasteryLevel;
  percentage: number;
  etymology: string;
  crossReferences: string[];
  /** The entry where this term was first encountered. */
  sourceEntryId?: string;
}

export interface EncounterRecord extends BaseRecord {
  studentId: string;
  notebookId: string;
  ref: string;
  thinker: string;
  tradition: string;
  coreIdea: string;
  sessionTopic: string;
  date: string;
  status: 'active' | 'dormant' | 'bridged' | 'pending';
  bridgedTo?: string;
  /** The entry that introduced this thinker. */
  sourceEntryId?: string;
}

export interface LibraryRecord extends BaseRecord {
  studentId: string;
  notebookId: string;
  title: string;
  author: string;
  isCurrent: boolean;
  annotationCount: number;
  quote: string;
}

export interface MasteryRecord extends BaseRecord {
  studentId: string;
  notebookId: string;
  concept: string;
  level: MasteryLevel;
  percentage: number;
  /** The entry that first introduced this concept. */
  sourceEntryId?: string;
}

export interface CuriosityRecord extends BaseRecord {
  studentId: string;
  notebookId: string;
  question: string;
}

/** Content-addressed blob — keyed by SHA-256 hash. */
export interface BlobRecord {
  hash: string;
  data: Blob;
  mimeType: string;
  size: number;
  createdAt: number;
  refId?: string;
}

export interface CanvasRecord extends BaseRecord {
  sessionId: string;
  positions: CanvasPosition[];
  connections: CanvasConnection[];
}
