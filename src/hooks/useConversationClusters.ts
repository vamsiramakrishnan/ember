/**
 * useConversationClusters — groups entries into conversational units.
 *
 * Entries linked by 'prompted-by' or 'follow-up' relations form a cluster.
 * Between clusters, larger breathing gaps appear. Within clusters, entries
 * are tightly spaced. This creates the visual rhythm of a notebook with
 * sections without violating chronological order.
 */
import { useMemo, useSyncExternalStore } from 'react';
import { subscribeGraph, getAllRelations } from '@/state/entry-graph';
import type { LiveEntry } from '@/types/entries';

export interface ClusterInfo {
  /** Whether this entry starts a new cluster (gap before it). */
  isClusterStart: boolean;
  /** The cluster index this entry belongs to. */
  clusterIndex: number;
}

/**
 * Compute cluster boundaries for a list of entries.
 * Two consecutive entries are in the same cluster if either:
 * - The second is 'prompted-by' the first
 * - The second is a 'follow-up' to the first
 * - They share a prompted-by chain (tutor response to the same student entry)
 */
export function useConversationClusters(entries: LiveEntry[]): Map<string, ClusterInfo> {
  // Subscribe to graph changes reactively
  const relations = useSyncExternalStore(subscribeGraph, getAllRelations);

  return useMemo(() => {
    const result = new Map<string, ClusterInfo>();
    if (entries.length === 0) return result;

    // Build a fast lookup: entryId → set of connected entry IDs
    const connected = new Set<string>();
    for (const rel of relations) {
      if (rel.type === 'prompted-by' || rel.type === 'follow-up') {
        connected.add(`${rel.from}→${rel.to}`);
        connected.add(`${rel.to}→${rel.from}`);
      }
    }

    let clusterIndex = 0;

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i]!;
      const prev = i > 0 ? entries[i - 1]! : null;

      const isLinked = prev !== null && (
        connected.has(`${entry.id}→${prev.id}`) ||
        connected.has(`${prev.id}→${entry.id}`)
      );

      if (!isLinked && i > 0) {
        clusterIndex++;
      }

      result.set(entry.id, {
        isClusterStart: !isLinked && i > 0,
        clusterIndex,
      });
    }

    return result;
  }, [entries, relations]);
}
