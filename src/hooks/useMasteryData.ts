/**
 * useMasteryData — reactive mastery state for the Constellation surface.
 * Reads from IndexedDB persistence layer instead of static demo data.
 * Falls back to demo data structure for thinkers (not yet persisted).
 */
import { Store, useStore } from '@/persistence';
import { getAllMastery, getAllCuriosities } from '@/persistence/repositories/mastery';
import { getAllLexicon } from '@/persistence/repositories/lexicon';
import { getAllEncounters } from '@/persistence/repositories/encounters';
import { getAllLibrary } from '@/persistence/repositories/library';
import { demoThinkers } from '@/data/demo-thinkers';
import type { MasteryRecord, CuriosityRecord, LexiconRecord, EncounterRecord, LibraryRecord } from '@/persistence/records';

export function useMasteryData() {
  const { data: masteryRecords } = useStore<MasteryRecord[]>(
    Store.Mastery, getAllMastery, [],
  );
  const { data: curiosityRecords } = useStore<CuriosityRecord[]>(
    Store.Curiosities, getAllCuriosities, [],
  );
  const { data: lexiconRecords } = useStore<LexiconRecord[]>(
    Store.Lexicon, getAllLexicon, [],
  );
  const { data: encounterRecords } = useStore<EncounterRecord[]>(
    Store.Encounters, getAllEncounters, [],
  );
  const { data: libraryRecords } = useStore<LibraryRecord[]>(
    Store.Library, getAllLibrary, [],
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
