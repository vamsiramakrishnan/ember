/**
 * useCrossNotebookBridges — surfaces surprising connections
 * between the current notebook and other notebooks.
 *
 * "Wait — Kepler's harmonic ratios relate to the genetic ratios
 * you explored in your Evolution notebook?"
 *
 * These bridges are the kind of insight that makes a student
 * feel like their knowledge is a living, connected network
 * rather than isolated silos.
 */
import { Store, useStoreQuery } from '@/persistence';
import { useStudent } from '@/contexts/StudentContext';
import {
  findCrossNotebookBridges,
  type CrossNotebookBridge,
} from '@/state/cross-notebook-bridge';

export function useCrossNotebookBridges() {
  const { student, notebook } = useStudent();
  const sid = student?.id ?? '';
  const nid = notebook?.id ?? '';

  const { data: bridges, loading } = useStoreQuery<CrossNotebookBridge[]>(
    Store.Mastery,
    () => (sid && nid)
      ? findCrossNotebookBridges(sid, nid)
      : Promise.resolve([]),
    [],
    [sid, nid],
  );

  return { bridges, loading };
}
