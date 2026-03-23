/**
 * useEntityResolver — resolves entity references to notebook entry IDs.
 *
 * When someone clicks a thinker name in Constellation, this resolver
 * finds the entry where that thinker was first introduced (the
 * thinker-card entry). When they click a concept, it finds the
 * entry where it was first explored.
 *
 * Resolution strategies:
 * 1. Graph relations: entity --introduced-by--> entry
 * 2. Entry content search: scan entries for matching content
 * 3. Temporal fallback: find earliest entry mentioning the name
 */
import { useCallback } from 'react';
import { useStudent } from '@/contexts/StudentContext';
import { getIncoming } from '@/persistence/repositories/graph';
import { getSessionsByNotebook } from '@/persistence/repositories/sessions';
import { getEntriesBySession } from '@/persistence/repositories/entries';
import type { EntryRecord } from '@/persistence/records';

export function useEntityResolver() {
  const { notebook } = useStudent();

  /** Resolve an entity ID + kind to the entry where it first appeared. */
  const resolveEntity = useCallback(async (
    entityId: string,
    _entityKind: string,
  ): Promise<string | null> => {
    // Strategy 1: check graph for introduced-by relation
    const incoming = await getIncoming(entityId);
    const introRelation = incoming.find(
      (r) => r.fromKind === 'entry' &&
        (r.type === 'introduces' || r.type === 'prompted-by'),
    );
    if (introRelation) return introRelation.from;

    return null;
  }, []);

  /** Resolve a name (concept/thinker/term) to its source entry. */
  const resolveByName = useCallback(async (
    name: string,
    kind: 'concept' | 'thinker' | 'term',
  ): Promise<string | null> => {
    if (!notebook) return null;

    const sessions = await getSessionsByNotebook(notebook.id);
    const lowerName = name.toLowerCase();

    // Scan entries chronologically for the first mention
    for (const session of sessions) {
      const entries = await getEntriesBySession(session.id);

      for (const entry of entries) {
        if (matchesEntry(entry, lowerName, kind)) {
          return entry.id;
        }
      }
    }

    return null;
  }, [notebook]);

  return { resolveEntity, resolveByName };
}

/** Check if an entry references the given name. */
function matchesEntry(
  entry: EntryRecord,
  lowerName: string,
  kind: 'concept' | 'thinker' | 'term',
): boolean {
  const e = entry.entry;

  switch (kind) {
    case 'thinker':
      if (e.type === 'thinker-card') {
        return e.thinker.name.toLowerCase().includes(lowerName);
      }
      break;

    case 'concept':
      if (e.type === 'concept-diagram') {
        return e.items.some(
          (item) => item.label.toLowerCase().includes(lowerName),
        );
      }
      if ('content' in e && typeof e.content === 'string') {
        return e.content.toLowerCase().includes(lowerName);
      }
      break;

    case 'term':
      if ('content' in e && typeof e.content === 'string') {
        return e.content.toLowerCase().includes(lowerName);
      }
      break;
  }

  return false;
}
