/**
 * EntryGraph queries — read-only traversal of the entry relationship graph.
 * Extracted from entry-graph.ts to maintain the 150-line discipline.
 */
import type { EntryRelation, RelationType } from './entry-graph-internals';
import { index } from './entry-graph-internals';

/** Get all entries that prompted this entry. */
export function getPrompters(entryId: string): EntryRelation[] {
  return index.byTo.get(entryId)?.filter(
    (r) => r.type === 'prompted-by',
  ) ?? [];
}

/** Get all entries that follow from this entry. */
export function getFollowUps(entryId: string): EntryRelation[] {
  return index.byFrom.get(entryId)?.filter(
    (r) => r.type === 'follow-up',
  ) ?? [];
}

/** Get all entries that reference this entry. */
export function getReferences(entryId: string): EntryRelation[] {
  return index.byTo.get(entryId)?.filter(
    (r) => r.type === 'references',
  ) ?? [];
}

/** Get all relations from an entry. */
export function getOutgoing(entryId: string): EntryRelation[] {
  return index.byFrom.get(entryId) ?? [];
}

/** Get all relations to an entry. */
export function getIncoming(entryId: string): EntryRelation[] {
  return index.byTo.get(entryId) ?? [];
}

/** Get the full follow-up chain starting from an entry. */
export function getFollowUpChain(entryId: string): string[] {
  const chain: string[] = [entryId];
  const visited = new Set([entryId]);
  let current = entryId;

  while (true) {
    const followUps = getFollowUps(current);
    if (followUps.length === 0) break;
    const next = followUps[0]!.to;
    if (visited.has(next)) break; // cycle guard
    visited.add(next);
    chain.push(next);
    current = next;
  }

  return chain;
}

/** Get all relations by type. */
export function getByType(type: RelationType): EntryRelation[] {
  return index.byType.get(type) ?? [];
}
