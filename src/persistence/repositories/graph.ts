/**
 * Graph repository — CRUD and traversal for the knowledge graph.
 *
 * Every relation is persisted to IndexedDB and indexed for
 * bidirectional traversal. The in-memory cache is rebuilt
 * lazily from persistence on first access.
 *
 * Traversal methods are pure query functions — they don't
 * mutate state. Mutations go through create/delete.
 */
import { put, getAll, getByIndex, del } from '../engine';
import { notify } from '../emitter';
import { recordOp } from '../sync/oplog';
import { createId } from '../ids';
import { Store } from '../schema';
import type { Relation, RelationType, EntityKind } from '@/types/entity';

const STORE = Store.Relations;

// ─── Write operations ─────────────────────────────────────

/** Create a relation. Deduplicates by from+to+type. */
export async function createRelation(
  params: Omit<Relation, 'id' | 'createdAt'>,
): Promise<Relation> {
  // Check for duplicates
  const existing = await getByIndex<Relation>(
    STORE, 'by-from-to', [params.from, params.to],
  );
  const dupe = existing.find((r) => r.type === params.type);
  if (dupe) return dupe;

  const relation: Relation = {
    ...params,
    id: createId(),
    createdAt: Date.now(),
  };
  await put(STORE, relation);
  notify(STORE);
  await recordOp(STORE, 'put', relation.id, relation);
  return relation;
}

/** Create multiple relations in a batch. Deduplicates internally. */
export async function createRelations(
  params: Array<Omit<Relation, 'id' | 'createdAt'>>,
): Promise<Relation[]> {
  if (params.length === 0) return [];

  const created: Relation[] = [];
  const seen = new Set<string>();

  for (const p of params) {
    const key = `${p.from}:${p.to}:${p.type}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const existing = await getByIndex<Relation>(
      STORE, 'by-from-to', [p.from, p.to],
    );
    if (existing.some((r) => r.type === p.type)) continue;

    const relation: Relation = {
      ...p,
      id: createId(),
      createdAt: Date.now(),
    };
    await put(STORE, relation);
    await recordOp(STORE, 'put', relation.id, relation);
    created.push(relation);
  }

  if (created.length > 0) notify(STORE);
  return created;
}

/** Delete a relation by ID. */
export async function deleteRelation(id: string): Promise<void> {
  await del(STORE, id);
  notify(STORE);
  await recordOp(STORE, 'delete', id);
}

// ─── Query operations ─────────────────────────────────────

/** Get all relations from an entity (outgoing edges). */
export async function getOutgoing(
  entityId: string,
): Promise<Relation[]> {
  return getByIndex<Relation>(STORE, 'by-from', entityId);
}

/** Get all relations to an entity (incoming edges). */
export async function getIncoming(
  entityId: string,
): Promise<Relation[]> {
  return getByIndex<Relation>(STORE, 'by-to', entityId);
}

/** Get outgoing relations of a specific type. */
export async function getOutgoingByType(
  entityId: string,
  type: RelationType,
): Promise<Relation[]> {
  return getByIndex<Relation>(
    STORE, 'by-from-type', [entityId, type],
  );
}

/** Get incoming relations of a specific type. */
export async function getIncomingByType(
  entityId: string,
  type: RelationType,
): Promise<Relation[]> {
  return getByIndex<Relation>(
    STORE, 'by-to-type', [entityId, type],
  );
}

/** Get all relations of a type within a notebook. */
export async function getByNotebookAndType(
  notebookId: string,
  type: RelationType,
): Promise<Relation[]> {
  return getByIndex<Relation>(
    STORE, 'by-notebook-type', [notebookId, type],
  );
}

/** Get all relations in a notebook. */
export async function getByNotebook(
  notebookId: string,
): Promise<Relation[]> {
  return getByIndex<Relation>(STORE, 'by-notebook', notebookId);
}

/** Get all relations globally. */
export async function getAllRelations(): Promise<Relation[]> {
  return getAll<Relation>(STORE);
}

// ─── Graph traversal ──────────────────────────────────────

/**
 * Follow a chain of relations of a given type, depth-first.
 * Returns ordered list of entity IDs from start to end.
 * Cycle-safe via visited set.
 */
export async function followChain(
  startId: string,
  type: RelationType,
  maxDepth: number = 20,
): Promise<string[]> {
  const chain: string[] = [startId];
  const visited = new Set([startId]);
  let current = startId;

  for (let depth = 0; depth < maxDepth; depth++) {
    const outgoing = await getOutgoingByType(current, type);
    if (outgoing.length === 0) break;
    const next = outgoing[0]!.to;
    if (visited.has(next)) break;
    visited.add(next);
    chain.push(next);
    current = next;
  }

  return chain;
}

/**
 * Find all entities reachable from a start entity via any
 * of the given relation types. BFS traversal. Returns entity IDs
 * grouped by distance from start.
 */
export async function traverse(
  startId: string,
  types: RelationType[],
  maxDepth: number = 3,
): Promise<Map<number, string[]>> {
  const result = new Map<number, string[]>();
  const visited = new Set([startId]);
  let frontier = [startId];

  for (let depth = 1; depth <= maxDepth; depth++) {
    const nextFrontier: string[] = [];

    for (const entityId of frontier) {
      const outgoing = await getOutgoing(entityId);
      for (const rel of outgoing) {
        if (!types.includes(rel.type)) continue;
        if (visited.has(rel.to)) continue;
        visited.add(rel.to);
        nextFrontier.push(rel.to);
      }
    }

    if (nextFrontier.length === 0) break;
    result.set(depth, nextFrontier);
    frontier = nextFrontier;
  }

  return result;
}

/**
 * Find the shortest path between two entities.
 * Returns the chain of entity IDs, or empty array if unreachable.
 */
export async function findPath(
  fromId: string,
  toId: string,
  maxDepth: number = 6,
): Promise<string[]> {
  const visited = new Set([fromId]);
  const parent = new Map<string, string>();
  let frontier = [fromId];

  for (let depth = 0; depth < maxDepth; depth++) {
    const nextFrontier: string[] = [];

    for (const entityId of frontier) {
      const outgoing = await getOutgoing(entityId);
      const incoming = await getIncoming(entityId);
      const neighbors = [
        ...outgoing.map((r) => r.to),
        ...incoming.map((r) => r.from),
      ];

      for (const neighbor of neighbors) {
        if (visited.has(neighbor)) continue;
        visited.add(neighbor);
        parent.set(neighbor, entityId);

        if (neighbor === toId) {
          // Reconstruct path
          const path: string[] = [toId];
          let current = toId;
          while (parent.has(current)) {
            current = parent.get(current)!;
            path.unshift(current);
          }
          return path;
        }

        nextFrontier.push(neighbor);
      }
    }

    if (nextFrontier.length === 0) break;
    frontier = nextFrontier;
  }

  return [];
}

/**
 * Get the neighborhood of an entity — all directly connected
 * entities with their relation types. Useful for the constellation view.
 */
export async function getNeighborhood(
  entityId: string,
): Promise<Array<{ entityId: string; kind: EntityKind; relation: RelationType; direction: 'out' | 'in' }>> {
  const [outgoing, incoming] = await Promise.all([
    getOutgoing(entityId),
    getIncoming(entityId),
  ]);

  return [
    ...outgoing.map((r) => ({
      entityId: r.to,
      kind: r.toKind,
      relation: r.type,
      direction: 'out' as const,
    })),
    ...incoming.map((r) => ({
      entityId: r.from,
      kind: r.fromKind,
      relation: r.type,
      direction: 'in' as const,
    })),
  ];
}
