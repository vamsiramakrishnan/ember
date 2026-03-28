/**
 * File Search — public API.
 * Re-exports store, indexing, and search modules.
 */
export { getOrCreateStore, uploadRawFile, deleteStore } from './store';
export type { MetadataEntry } from './store';
export {
  indexSession, indexLexicon, indexEncounters,
  indexLibrary, indexMastery, indexCuriosities,
} from './indexing';
export { searchAll, searchNotebook, searchByType, searchWithFilter } from './search';
export type { SearchResult } from './search';
export { indexCurrentSession } from './session-indexer';
export { indexTeachingEntry } from './teaching-indexer';
