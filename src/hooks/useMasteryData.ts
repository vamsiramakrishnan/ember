/**
 * useMasteryData — reactive mastery state for the Constellation surface.
 * All data derived from notebook-scoped persistence. No demo fallbacks.
 */
import { Store, useStoreQuery } from '@/persistence';
import { getMasteryByNotebook, getCuriositiesByNotebook } from '@/persistence/repositories/mastery';
import { getLexiconByNotebook } from '@/persistence/repositories/lexicon';
import { getEncountersByNotebook } from '@/persistence/repositories/encounters';
import { getLibraryByNotebook } from '@/persistence/repositories/library';
import { useStudent } from '@/contexts/StudentContext';
import type { Thinker } from '@/types/entries';
import type { MasteryRecord, CuriosityRecord, LexiconRecord, EncounterRecord, LibraryRecord } from '@/persistence/records';

/** Derive Thinker cards from EncounterRecords. */
function encounterToThinker(e: EncounterRecord): Thinker {
  return {
    name: e.thinker,
    dates: e.date,
    gift: e.coreIdea,
    bridge: e.bridgedTo
      ? `Bridges to ${e.bridgedTo}`
      : `${e.tradition} · ${e.sessionTopic}`,
  };
}

export function useMasteryData() {
  const { notebook } = useStudent();
  const nid = notebook?.id ?? '';

  const { data: masteryRecords } = useStoreQuery<MasteryRecord[]>(
    Store.Mastery,
    () => nid ? getMasteryByNotebook(nid) : Promise.resolve([]),
    [], [nid],
  );
  const { data: curiosityRecords } = useStoreQuery<CuriosityRecord[]>(
    Store.Curiosities,
    () => nid ? getCuriositiesByNotebook(nid) : Promise.resolve([]),
    [], [nid],
  );
  const { data: lexiconRecords } = useStoreQuery<LexiconRecord[]>(
    Store.Lexicon,
    () => nid ? getLexiconByNotebook(nid) : Promise.resolve([]),
    [], [nid],
  );
  const { data: encounterRecords } = useStoreQuery<EncounterRecord[]>(
    Store.Encounters,
    () => nid ? getEncountersByNotebook(nid) : Promise.resolve([]),
    [], [nid],
  );
  const { data: libraryRecords } = useStoreQuery<LibraryRecord[]>(
    Store.Library,
    () => nid ? getLibraryByNotebook(nid) : Promise.resolve([]),
    [], [nid],
  );

  const concepts = masteryRecords
    .map((m) => ({ concept: m.concept, level: m.level, percentage: m.percentage }))
    .sort((a, b) => b.percentage - a.percentage);

  const threads = curiosityRecords.map((c) => ({ question: c.question }));

  const thinkers = encounterRecords
    .filter((e) => e.status === 'active' || e.status === 'bridged')
    .map(encounterToThinker);

  const lexicon = lexiconRecords.map((l) => ({
    number: l.number, term: l.term, pronunciation: l.pronunciation,
    definition: l.definition, level: l.level, percentage: l.percentage,
    etymology: l.etymology, crossReferences: l.crossReferences,
  }));

  const encounters = encounterRecords.map((e) => ({
    ref: e.ref, thinker: e.thinker, tradition: e.tradition,
    coreIdea: e.coreIdea, sessionTopic: e.sessionTopic,
    date: e.date, status: e.status, bridgedTo: e.bridgedTo,
  }));

  const library = libraryRecords.map((l) => ({
    title: l.title, author: l.author, isCurrent: l.isCurrent,
    annotationCount: l.annotationCount, quote: l.quote,
  }));

  return { concepts, threads, thinkers, lexicon, encounters, library };
}
