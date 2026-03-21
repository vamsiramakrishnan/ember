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
export * as sessions from './repositories/sessions';
export * as entries from './repositories/entries';
export * as lexicon from './repositories/lexicon';
export * as encounters from './repositories/encounters';
export * as library from './repositories/library';
export * as mastery from './repositories/mastery';
export * as blobs from './repositories/blobs';
export * as canvas from './repositories/canvas';

// Record types
export type {
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
