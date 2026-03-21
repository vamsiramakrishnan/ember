/**
 * useMasteryData — mastery state for the Constellation surface.
 */
import { demoMastery, demoCuriosityThreads } from '@/data/demo-mastery';
import { demoThinkers } from '@/data/demo-thinkers';

export function useMasteryData() {
  return {
    concepts: demoMastery,
    threads: demoCuriosityThreads,
    thinkers: demoThinkers,
  };
}
