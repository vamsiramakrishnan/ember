/**
 * useEntryGraph — React hook for the entry relationship graph.
 * Uses useSyncExternalStore for tear-free reads.
 */
import { useSyncExternalStore, useMemo } from 'react';
import {
  subscribeGraph,
  getAllRelations,
  getOutgoing,
  getIncoming,
  getFollowUpChain,
  type EntryRelation,
} from './entry-graph';

/** Subscribe to all relations (for graph views). */
export function useEntryRelations(): readonly EntryRelation[] {
  return useSyncExternalStore(subscribeGraph, getAllRelations);
}

/** Get relations for a specific entry. */
export function useEntryConnections(entryId: string) {
  const relations = useEntryRelations();

  return useMemo(() => ({
    outgoing: getOutgoing(entryId),
    incoming: getIncoming(entryId),
    followUpChain: getFollowUpChain(entryId),
  }), [entryId, relations]);
}
