/**
 * Mapper functions — explicit transformations between persistence records
 * and view-layer types. These replace inline field-by-field copying that
 * was previously scattered across hooks.
 *
 * Convention: each mapper is named `<Record>ToView` and returns the
 * corresponding UI type. Fields that exist only on the record side
 * (e.g. id, studentId, notebookId, timestamps) are dropped. Fields
 * that exist only on the view side receive safe defaults.
 */
import type { EncounterRecord, LexiconRecord, LibraryRecord } from './records';
import type { Encounter, LexiconEntry, PrimaryText } from '@/types/lexicon';

/**
 * Map an EncounterRecord to its view-layer Encounter shape.
 * The record carries persistence fields (id, studentId, notebookId,
 * createdAt, updatedAt, sourceEntryId) that the view does not need.
 * The view carries `portraitUrl` which the record does not store.
 */
export function encounterRecordToView(record: EncounterRecord): Encounter {
  return {
    ref: record.ref,
    thinker: record.thinker,
    tradition: record.tradition,
    coreIdea: record.coreIdea,
    sessionTopic: record.sessionTopic,
    date: record.date,
    status: record.status,
    bridgedTo: record.bridgedTo,
    portraitUrl: undefined,
  };
}

/**
 * Map a LexiconRecord to its view-layer LexiconEntry shape.
 * The record carries persistence fields (id, studentId, notebookId,
 * createdAt, updatedAt, sourceEntryId) that the view does not need.
 */
export function lexiconRecordToView(record: LexiconRecord): LexiconEntry {
  return {
    number: record.number,
    term: record.term,
    pronunciation: record.pronunciation,
    definition: record.definition,
    level: record.level,
    percentage: record.percentage,
    etymology: record.etymology,
    crossReferences: record.crossReferences,
  };
}

/**
 * Map a LibraryRecord to its view-layer PrimaryText shape.
 * The record carries persistence fields (id, studentId, notebookId,
 * createdAt, updatedAt) that the view does not need.
 * The view carries `coverUrl` which the record does not store.
 */
export function libraryRecordToView(record: LibraryRecord): PrimaryText {
  return {
    title: record.title,
    author: record.author,
    isCurrent: record.isCurrent,
    annotationCount: record.annotationCount,
    quote: record.quote,
    coverUrl: undefined,
  };
}
