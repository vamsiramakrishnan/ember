/**
 * useMasteryData — mastery state for the Constellation surface.
 * Provides concepts, threads, thinkers, lexicon, encounters, and library data.
 */
import { demoMastery, demoCuriosityThreads } from '@/data/demo-mastery';
import { demoThinkers } from '@/data/demo-thinkers';
import { demoLexicon } from '@/data/demo-lexicon';
import { demoEncounters } from '@/data/demo-encounters';
import { demoLibrary } from '@/data/demo-library';

export function useMasteryData() {
  return {
    concepts: demoMastery,
    threads: demoCuriosityThreads,
    thinkers: demoThinkers,
    lexicon: demoLexicon,
    encounters: demoEncounters,
    library: demoLibrary,
  };
}
