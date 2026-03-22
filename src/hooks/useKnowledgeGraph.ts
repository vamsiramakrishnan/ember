/**
 * useKnowledgeGraph — React hook for the persisted knowledge graph.
 *
 * Provides reactive graph queries that re-fetch when the Relations
 * store changes. Replaces the in-memory entry-graph hooks with
 * persistence-backed traversal.
 */
import { useMemo, useCallback } from 'react';
import { Store, useStoreQuery } from '@/persistence';
import {
  getOutgoing,
  getIncoming,
  getNeighborhood,
  followChain,
  traverse,
  findPath,
  getByNotebook,
} from '@/persistence/repositories/graph';
import { useStudent } from '@/contexts/StudentContext';
import type { Relation, RelationType, EntityKind } from '@/types/entity';

/** All relations for the current notebook. */
export function useNotebookGraph() {
  const { notebook } = useStudent();
  const nid = notebook?.id ?? '';

  const { data: relations, loading } = useStoreQuery<Relation[]>(
    Store.Relations,
    () => nid ? getByNotebook(nid) : Promise.resolve([]),
    [],
    [nid],
  );

  return { relations, loading };
}

/** Relations for a specific entity (both directions). */
export function useEntityRelations(entityId: string) {
  const { data: outgoing } = useStoreQuery<Relation[]>(
    Store.Relations,
    () => entityId ? getOutgoing(entityId) : Promise.resolve([]),
    [],
    [entityId],
  );

  const { data: incoming } = useStoreQuery<Relation[]>(
    Store.Relations,
    () => entityId ? getIncoming(entityId) : Promise.resolve([]),
    [],
    [entityId],
  );

  return useMemo(() => ({
    outgoing,
    incoming,
    all: [...outgoing, ...incoming],
  }), [outgoing, incoming]);
}

/** Neighborhood of an entity — all directly connected entities. */
export function useNeighborhood(entityId: string) {
  const { data: neighbors } = useStoreQuery(
    Store.Relations,
    () => entityId ? getNeighborhood(entityId) : Promise.resolve([]),
    [] as Array<{ entityId: string; kind: EntityKind; relation: RelationType; direction: 'out' | 'in' }>,
    [entityId],
  );

  return neighbors;
}

/** Imperative graph operations for components that need them. */
export function useGraphTraversal() {
  const traverseGraph = useCallback(async (
    startId: string,
    types: RelationType[],
    maxDepth?: number,
  ) => {
    return traverse(startId, types, maxDepth);
  }, []);

  const findPathBetween = useCallback(async (
    fromId: string,
    toId: string,
  ) => {
    return findPath(fromId, toId);
  }, []);

  const followRelationChain = useCallback(async (
    startId: string,
    type: RelationType,
  ) => {
    return followChain(startId, type);
  }, []);

  return { traverseGraph, findPathBetween, followRelationChain };
}
