/**
 * Persisted record types — the shapes stored in IndexedDB.
 * These are the "rows" in each object store.
 * Separate from UI types: persistence records carry IDs, timestamps, ordering.
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

export interface SessionRecord extends BaseRecord {
  number: number;
  date: string;
  timeOfDay: string;
  topic: string;
}

export interface EntryRecord extends BaseRecord {
  sessionId: string;
  /** Fractional ordering index for stable sort without reindexing. */
  order: number;
  /** The entry type discriminant, denormalized for index queries. */
  type: NotebookEntry['type'];
  /** The full entry payload. */
  entry: NotebookEntry;
  crossedOut: boolean;
  bookmarked: boolean;
  pinned: boolean;
  /** If entry contains a blob (sketch), the content-addressed hash. */
  blobHash?: string;
}

export interface LexiconRecord extends BaseRecord {
  number: number;
  term: string;
  pronunciation: string;
  definition: string;
  level: MasteryLevel;
  percentage: number;
  etymology: string;
  crossReferences: string[];
}

export interface EncounterRecord extends BaseRecord {
  ref: string;
  thinker: string;
  tradition: string;
  coreIdea: string;
  sessionTopic: string;
  date: string;
  status: 'active' | 'dormant' | 'bridged' | 'pending';
  bridgedTo?: string;
}

export interface LibraryRecord extends BaseRecord {
  title: string;
  author: string;
  isCurrent: boolean;
  annotationCount: number;
  quote: string;
}

export interface MasteryRecord extends BaseRecord {
  concept: string;
  level: MasteryLevel;
  percentage: number;
}

export interface CuriosityRecord extends BaseRecord {
  question: string;
}

/** Content-addressed blob — keyed by SHA-256 hash. */
export interface BlobRecord {
  hash: string;
  data: Blob;
  mimeType: string;
  size: number;
  createdAt: number;
  /** Optional reference back to the entry that owns this blob. */
  refId?: string;
}

export interface CanvasRecord extends BaseRecord {
  sessionId: string;
  positions: CanvasPosition[];
  connections: CanvasConnection[];
}
