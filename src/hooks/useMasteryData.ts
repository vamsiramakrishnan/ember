/**
 * useMasteryData — reactive mastery state for the Constellation surface.
 * All data derived from notebook-scoped persistence. No demo fallbacks.
 */
import { useMemo } from 'react';
import { Store, useStoreQuery } from '@/persistence';
import { getMasteryByNotebook, getCuriositiesByNotebook } from '@/persistence/repositories/mastery';
import { getLexiconByNotebook } from '@/persistence/repositories/lexicon';
import { getEncountersByNotebook } from '@/persistence/repositories/encounters';
import { getLibraryByNotebook } from '@/persistence/repositories/library';
import { useStudent } from '@/contexts/StudentContext';
import type { Thinker } from '@/types/entries';
import type { MasteryRecord, CuriosityRecord, LexiconRecord, EncounterRecord, LibraryRecord } from '@/persistence/records';
import { encounterRecordToView, lexiconRecordToView, libraryRecordToView } from '@/persistence/mappers';

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

  const concepts = useMemo(() =>
    masteryRecords
      .map((m) => ({ concept: m.concept, level: m.level, percentage: m.percentage }))
      .sort((a, b) => b.percentage - a.percentage),
    [masteryRecords],
  );

  const threads = useMemo(() =>
    curiosityRecords.map((c) => ({ question: c.question })),
    [curiosityRecords],
  );

  const thinkers = useMemo(() =>
    encounterRecords
      .filter((e) => e.status === 'active' || e.status === 'bridged')
      .map(encounterToThinker),
    [encounterRecords],
  );

  const lexicon = useMemo(() =>
    lexiconRecords.map(lexiconRecordToView),
    [lexiconRecords],
  );

  const encounters = useMemo(() =>
    encounterRecords.map(encounterRecordToView),
    [encounterRecords],
  );

  const library = useMemo(() =>
    libraryRecords.map(libraryRecordToView),
    [libraryRecords],
  );

  return { concepts, threads, thinkers, lexicon, encounters, library };
}
