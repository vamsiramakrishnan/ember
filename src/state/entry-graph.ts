/**
 * EntryGraph — relationship graph between notebook entries.
 *
 * Eigen principle: Ideas don't exist in isolation. Every entry has
 * a provenance (what prompted it), siblings (what was said at the
 * same time), and descendants (what it inspired). The graph makes
 * these relationships explicit and traversable.
 *
 * Traces to:
 * - Principle II (Permanence): entries are never deleted, only linked
 * - 04-information-architecture.md: constellation references notebook
 * - 07-compositional-grammar.md: Pattern 4 (accumulation over time)
 */

import { createRelation as persistRelation, getByNotebook } from '@/persistence/repositories/graph';
import { relations, index, listeners, emit, addToIndex } from './entry-graph-internals';
import type { EntryRelation, RelationType } from './entry-graph-internals';

// Re-export types
export type { EntryRelation, RelationType } from './entry-graph-internals';

// Re-export query functions
export {
  getPrompters, getFollowUps, getReferences,
  getOutgoing, getIncoming, getFollowUpChain, getByType,
} from './entry-graph-queries';

// Track notebook context for persistence
let currentNotebookId = '';

/** Set the notebook context for persisting relations. */
export function setNotebookContext(notebookId: string): void {
  currentNotebookId = notebookId;
}

// ─── Mutations ────────────────────────────────────────────

/** Add a relationship between two entries. */
export function addRelation(rel: EntryRelation): void {
  const exists = relations.some(
    (r) => r.from === rel.from && r.to === rel.to && r.type === rel.type,
  );
  if (exists) return;

  relations.push(rel);
  addToIndex(rel);
  emit();

  // Persist to IndexedDB (fire-and-forget)
  if (currentNotebookId) {
    void persistRelation({
      notebookId: currentNotebookId,
      from: rel.from,
      fromKind: 'entry',
      to: rel.to,
      toKind: 'entry',
      type: rel.type,
      weight: 1.0,
      meta: rel.meta,
    }).catch(() => { /* relation may already exist */ });
  }
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

// ─── Subscriptions & snapshots ────────────────────────────

/** Subscribe to graph changes. */
export function subscribeGraph(listener: () => void): () => void {
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

// ─── Persistence bridge ──────────────────────────────────

/** Load persisted relations into the in-memory graph. */
export async function loadFromPersistence(notebookId: string): Promise<void> {
  setNotebookContext(notebookId);
  const persisted = await getByNotebook(notebookId);

  for (const r of persisted) {
    if (r.fromKind === 'entry' && r.toKind === 'entry') {
      const rel: EntryRelation = {
        from: r.from,
        to: r.to,
        type: r.type as RelationType,
        meta: r.meta,
      };
      const exists = relations.some(
        (existing) => existing.from === rel.from && existing.to === rel.to && existing.type === rel.type,
      );
      if (!exists) {
        relations.push(rel);
        addToIndex(rel);
      }
    }
  }
  emit();
}
