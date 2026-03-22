/**
 * useMasteryData — reactive mastery state for the Constellation surface.
 * Scoped to the current notebook from StudentContext.
 * Falls back to demo data structure for thinkers (not yet persisted).
 */
import { Store, useStoreQuery } from '@/persistence';
import { getMasteryByNotebook, getCuriositiesByNotebook } from '@/persistence/repositories/mastery';
import { getLexiconByNotebook } from '@/persistence/repositories/lexicon';
import { getEncountersByNotebook } from '@/persistence/repositories/encounters';
import { getLibraryByNotebook } from '@/persistence/repositories/library';
import { useStudent } from '@/contexts/StudentContext';
import { demoThinkers } from '@/data/demo-thinkers';
import type { MasteryRecord, CuriosityRecord, LexiconRecord, EncounterRecord, LibraryRecord } from '@/persistence/records';

export function useMasteryData() {
  const { notebook } = useStudent();
  const notebookId = notebook?.id ?? '';

  const { data: masteryRecords } = useStoreQuery<MasteryRecord[]>(
    Store.Mastery,
    () => notebookId ? getMasteryByNotebook(notebookId) : Promise.resolve([]),
    [],
    [notebookId],
  );
  const { data: curiosityRecords } = useStoreQuery<CuriosityRecord[]>(
    Store.Curiosities,
    () => notebookId ? getCuriositiesByNotebook(notebookId) : Promise.resolve([]),
    [],
    [notebookId],
  );
  const { data: lexiconRecords } = useStoreQuery<LexiconRecord[]>(
    Store.Lexicon,
    () => notebookId ? getLexiconByNotebook(notebookId) : Promise.resolve([]),
    [],
    [notebookId],
  );
  const { data: encounterRecords } = useStoreQuery<EncounterRecord[]>(
    Store.Encounters,
    () => notebookId ? getEncountersByNotebook(notebookId) : Promise.resolve([]),
    [],
    [notebookId],
  );
  const { data: libraryRecords } = useStoreQuery<LibraryRecord[]>(
    Store.Library,
    () => notebookId ? getLibraryByNotebook(notebookId) : Promise.resolve([]),
    [],
    [notebookId],
  );

  const concepts = masteryRecords
    .map((m) => ({
      concept: m.concept,
      level: m.level,
      percentage: m.percentage,
    }))
    .sort((a, b) => b.percentage - a.percentage);

  const threads = curiosityRecords.map((c) => ({
    question: c.question,
  }));

  const lexicon = lexiconRecords.map((l) => ({
    number: l.number,
    term: l.term,
    pronunciation: l.pronunciation,
    definition: l.definition,
    level: l.level,
    percentage: l.percentage,
    etymology: l.etymology,
    crossReferences: l.crossReferences,
  }));

  const encounters = encounterRecords.map((e) => ({
    ref: e.ref,
    thinker: e.thinker,
    tradition: e.tradition,
    coreIdea: e.coreIdea,
    sessionTopic: e.sessionTopic,
    date: e.date,
    status: e.status,
    bridgedTo: e.bridgedTo,
  }));

  const library = libraryRecords.map((l) => ({
    title: l.title,
    author: l.author,
    isCurrent: l.isCurrent,
    annotationCount: l.annotationCount,
    quote: l.quote,
  }));

  return {
    concepts,
    threads,
    thinkers: demoThinkers,
    lexicon,
    encounters,
    library,
  };
}
