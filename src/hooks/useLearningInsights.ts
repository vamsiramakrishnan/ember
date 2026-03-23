/**
 * useLearningInsights — React hooks that surface the learning
 * intelligence layer into the UX.
 *
 * These hooks bridge the gap between raw data and the student's
 * experience. They answer the questions a student asks (silently):
 *
 * "What should I explore next?"
 * "How is my understanding growing?"
 * "What questions have I left open?"
 * "What connects to what I'm looking at?"
 * "Where are my blind spots?"
 *
 * Each hook is reactive (re-fetches on store changes) and scoped
 * to the current notebook.
 */
import { useMemo } from 'react';
import { Store, useStoreQuery } from '@/persistence';
import { useStudent } from '@/contexts/StudentContext';
import {
  findLearningGaps,
  suggestExplorations,
  trackThreads,
  findConceptClusters,
  type LearningGap,
  type ExplorationSuggestion,
  type TrackedThread,
  type ConceptCluster,
} from '@/state/learning-intelligence';

// ─── Learning gaps ────────────────────────────────────────

/** What concepts need attention relative to what's strong. */
export function useLearningGaps() {
  const { notebook } = useStudent();
  const nid = notebook?.id ?? '';

  const { data: gaps, loading } = useStoreQuery<LearningGap[]>(
    Store.Relations,
    () => nid ? findLearningGaps(nid) : Promise.resolve([]),
    [],
    [nid],
  );

  return { gaps, loading };
}

// ─── Exploration suggestions ──────────────────────────────

/** What to explore next based on graph topology. */
export function useExplorationSuggestions() {
  const { notebook } = useStudent();
  const nid = notebook?.id ?? '';

  const { data: suggestions, loading } = useStoreQuery<ExplorationSuggestion[]>(
    Store.Relations,
    () => nid ? suggestExplorations(nid) : Promise.resolve([]),
    [],
    [nid],
  );

  return { suggestions, loading };
}

// ─── Thread tracking ──────────────────────────────────────

/** Which questions are open, partially addressed, or resolved. */
export function useThreadTracker() {
  const { notebook } = useStudent();
  const nid = notebook?.id ?? '';

  const { data: threads, loading } = useStoreQuery<TrackedThread[]>(
    Store.Curiosities,
    () => nid ? trackThreads(nid) : Promise.resolve([]),
    [],
    [nid],
  );

  const open = useMemo(
    () => threads.filter((t) => t.status === 'open'),
    [threads],
  );

  const partial = useMemo(
    () => threads.filter((t) => t.status === 'partially-addressed'),
    [threads],
  );

  const resolved = useMemo(
    () => threads.filter((t) => t.status === 'resolved'),
    [threads],
  );

  return { threads, open, partial, resolved, loading };
}

// ─── Concept clusters ─────────────────────────────────────

/** Natural groupings of related concepts. */
export function useConceptClusters() {
  const { notebook } = useStudent();
  const nid = notebook?.id ?? '';

  const { data: clusters, loading } = useStoreQuery<ConceptCluster[]>(
    Store.Relations,
    () => nid ? findConceptClusters(nid) : Promise.resolve([]),
    [],
    [nid],
  );

  return { clusters, loading };
}
