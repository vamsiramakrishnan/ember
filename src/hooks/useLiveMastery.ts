/**
 * useLiveMastery — reactive mastery data from IndexedDB.
 * Replaces the static demo mastery data with live persistence reads.
 * Updates mastery, lexicon, encounters from the persistence layer.
 */
import { Store, useStore } from '@/persistence';
import { getAllMastery } from '@/persistence/repositories/mastery';
import { getAllLexicon } from '@/persistence/repositories/lexicon';
import { getAllEncounters } from '@/persistence/repositories/encounters';
import { getAllLibrary } from '@/persistence/repositories/library';
import type { MasteryRecord, LexiconRecord, EncounterRecord, LibraryRecord } from '@/persistence/records';

export function useLiveMastery() {
  const { data: mastery, loading: masteryLoading } = useStore<MasteryRecord[]>(
    Store.Mastery,
    getAllMastery,
    [],
  );

  return {
    mastery: mastery.sort((a, b) => b.percentage - a.percentage),
    loading: masteryLoading,
  };
}

export function useLiveLexicon() {
  const { data: lexicon, loading } = useStore<LexiconRecord[]>(
    Store.Lexicon,
    getAllLexicon,
    [],
  );

  return { lexicon, loading };
}

export function useLiveEncounters() {
  const { data: encounters, loading } = useStore<EncounterRecord[]>(
    Store.Encounters,
    getAllEncounters,
    [],
  );

  return { encounters, loading };
}

export function useLiveLibrary() {
  const { data: library, loading } = useStore<LibraryRecord[]>(
    Store.Library,
    getAllLibrary,
    [],
  );

  return { library, loading };
}
