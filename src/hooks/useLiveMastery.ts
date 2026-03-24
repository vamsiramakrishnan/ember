/**
 * useLiveMastery — reactive mastery data from IndexedDB.
 * Replaces the static demo mastery data with live persistence reads.
 * Updates mastery, lexicon, encounters from the persistence layer.
 */
import { useMemo } from 'react';
import { Store, useStore } from '@/persistence';
import { getAllMastery } from '@/persistence/repositories/mastery';
import { getAllLexicon } from '@/persistence/repositories/lexicon';
import { getAllEncounters } from '@/persistence/repositories/encounters';
import { getAllLibrary } from '@/persistence/repositories/library';
import type { MasteryRecord, LexiconRecord, EncounterRecord, LibraryRecord } from '@/persistence/records';
import { encounterRecordToView, lexiconRecordToView, libraryRecordToView } from '@/persistence/mappers';

export function useLiveMastery() {
  const { data: mastery, loading: masteryLoading } = useStore<MasteryRecord[]>(
    Store.Mastery,
    getAllMastery,
    [],
  );

  const sorted = useMemo(
    () => [...mastery].sort((a, b) => b.percentage - a.percentage),
    [mastery],
  );

  return {
    mastery: sorted,
    loading: masteryLoading,
  };
}

export function useLiveLexicon() {
  const { data: lexiconRecords, loading } = useStore<LexiconRecord[]>(
    Store.Lexicon,
    getAllLexicon,
    [],
  );

  const lexicon = useMemo(() => lexiconRecords.map(lexiconRecordToView), [lexiconRecords]);

  return { lexicon, loading };
}

export function useLiveEncounters() {
  const { data: encounterRecords, loading } = useStore<EncounterRecord[]>(
    Store.Encounters,
    getAllEncounters,
    [],
  );

  const encounters = useMemo(() => encounterRecords.map(encounterRecordToView), [encounterRecords]);

  return { encounters, loading };
}

export function useLiveLibrary() {
  const { data: libraryRecords, loading } = useStore<LibraryRecord[]>(
    Store.Library,
    getAllLibrary,
    [],
  );

  const library = useMemo(() => libraryRecords.map(libraryRecordToView), [libraryRecords]);

  return { library, loading };
}
