/**
 * EntryGraph — relationship graph between notebook entries.
 *
 * Eigen principle: Ideas don't exist in isolation. Every entry has
 * a provenance (what prompted it), siblings (what was said at the
 * same time), and descendants (what it inspired). The graph makes
 * these relationships explicit and traversable.
 *
 * This enables:
 * - Follow-up chains: question → answer → follow-up → answer
 * - Deep linking: click a concept to see where it first appeared
 * - Cross-linking: constellation entries link back to notebook entries
 * - Tutor context: "you asked about X in entry Y" with precise reference
 *
 * Traces to:
 * - Principle II (Permanence): entries are never deleted, only linked
 * - 04-information-architecture.md: constellation references notebook
 * - 07-compositional-grammar.md: Pattern 4 (accumulation over time)
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

/** The in-memory graph. */
const relations: EntryRelation[] = [];
const index = {
  byFrom: new Map<string, EntryRelation[]>(),
  byTo: new Map<string, EntryRelation[]>(),
  byType: new Map<RelationType, EntryRelation[]>(),
};

type Listener = () => void;
const listeners = new Set<Listener>();

function emit() {
  for (const l of listeners) l();
}

function addToIndex(rel: EntryRelation) {
  if (!index.byFrom.has(rel.from)) index.byFrom.set(rel.from, []);
  index.byFrom.get(rel.from)!.push(rel);

  if (!index.byTo.has(rel.to)) index.byTo.set(rel.to, []);
  index.byTo.get(rel.to)!.push(rel);

  if (!index.byType.has(rel.type)) index.byType.set(rel.type, []);
  index.byType.get(rel.type)!.push(rel);
}

// ─── Public API ────────────────────────────────────────────

/** Add a relationship between two entries. */
export function addRelation(rel: EntryRelation): void {
  // Deduplicate
  const exists = relations.some(
    (r) => r.from === rel.from && r.to === rel.to && r.type === rel.type,
  );
  if (exists) return;

  relations.push(rel);
  addToIndex(rel);
  emit();
}

/** Add a batch of relations. */
export function addRelations(rels: EntryRelation[]): void {
  let added = false;
  for (const rel of rels) {
    const exists = relations.some(
      (r) => r.from === rel.from && r.to === rel.to && r.type === rel.type,
    );
    if (!exists) {
      relations.push(rel);
      addToIndex(rel);
      added = true;
    }
  }
  if (added) emit();
}

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

/** Subscribe to graph changes. */
export function subscribeGraph(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Get all relations (snapshot). */
export function getAllRelations(): readonly EntryRelation[] {
  return relations;
}

/** Clear the graph (for session reset). */
export function clearGraph(): void {
  relations.length = 0;
  index.byFrom.clear();
  index.byTo.clear();
  index.byType.clear();
  emit();
}
