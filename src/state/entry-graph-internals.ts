/**
 * EntryGraph internals — shared types, mutable state, and index
 * helpers for the entry graph. Separated so that entry-graph.ts
 * (mutations) and entry-graph-queries.ts (reads) can share
 * state without circular imports.
 */

/** A relationship between two entries. */
export interface EntryRelation {
  /** ID of the source entry. */
  from: string;
  /** ID of the target entry. */
  to: string;
  /** Type of relationship. */
  type: RelationType;
  /** Optional metadata (e.g., the follow-up question text). */
  meta?: string;
}

export type RelationType =
  | 'prompted-by'       // This entry was prompted by another (student → tutor)
  | 'follow-up'         // This entry is a follow-up to another
  | 'references'        // This entry references a concept from another
  | 'branches-from'     // This entry branched into a new notebook
  | 'echoes'            // Echo entry references original student thought
  | 'extends'           // Tutor extends or deepens a prior response
  | 'contradicts'       // Student hypothesis contradicts a prior entry
  | 'confirms';         // Tutor confirms a student hypothesis

/** The in-memory relations array. */
export const relations: EntryRelation[] = [];

/** Indexed views into the relations array. */
export const index = {
  byFrom: new Map<string, EntryRelation[]>(),
  byTo: new Map<string, EntryRelation[]>(),
  byType: new Map<RelationType, EntryRelation[]>(),
};

type Listener = () => void;
export const listeners = new Set<Listener>();

export function emit(): void {
  for (const l of listeners) l();
}

export function addToIndex(rel: EntryRelation): void {
  if (!index.byFrom.has(rel.from)) index.byFrom.set(rel.from, []);
  index.byFrom.get(rel.from)!.push(rel);

  if (!index.byTo.has(rel.to)) index.byTo.set(rel.to, []);
  index.byTo.get(rel.to)!.push(rel);

  if (!index.byType.has(rel.type)) index.byType.set(rel.type, []);
  index.byType.get(rel.type)!.push(rel);
}
