/**
 * Persistence layer — public API.
 * Import from '@/persistence' for all storage operations.
 */

// Core
export { openDB } from './engine';
export { Store } from './schema';
export { createId } from './ids';
export { seedIfEmpty } from './seed';

// Reactive reads
export { useStore, useStoreQuery } from './useStore';
export { notify, notifyStores, subscribe } from './emitter';
export { reactivePut, reactiveDel, reactiveTransact } from './reactive';

// Repositories
export * as students from './repositories/students';
export * as notebooks from './repositories/notebooks';
export * as sessions from './repositories/sessions';
export * as entries from './repositories/entries';
export * as lexicon from './repositories/lexicon';
export * as encounters from './repositories/encounters';
export * as library from './repositories/library';
export * as mastery from './repositories/mastery';
export * as blobs from './repositories/blobs';
export * as canvas from './repositories/canvas';
export * as graph from './repositories/graph';
export * as events from './repositories/events';
export * as blobEntities from './repositories/blob-entities';

// Sync
export { registerAdapter, startSync, stopSync, sync } from './sync';
export { useSyncStatus } from './sync/useSyncStatus';

// Record types
export type {
  StudentRecord,
  NotebookRecord,
  SessionRecord,
  EntryRecord,
  LexiconRecord,
  EncounterRecord,
  LibraryRecord,
  MasteryRecord,
  CuriosityRecord,
  BlobRecord,
  CanvasRecord,
} from './records';

// Entity types (new unified model)
export type {
  Entity,
  EntityKind,
  Relation,
  RelationType,
  CollaborationEvent,
  Annotation,
} from '@/types/entity';
