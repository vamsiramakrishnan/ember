/**
 * useChipResolver — resolves entity details for MentionChip hover previews.
 * Bridges the entity index (search) to the ChipContext (preview data).
 * Used at the Notebook surface level to provide context to all chips below.
 */
import { useCallback, useMemo } from 'react';
import { useEntityIndex, type EntityType } from './useEntityIndex';
import type { EntityPreview } from '@/primitives/ChipContext';

export function useChipResolver() {
  const { entities, search } = useEntityIndex();

  const resolveEntity = useCallback(
    (eType: EntityType, eId: string): EntityPreview | null => {
      // Exact ID match first — O(n) but fast for small indices
      const exact = entities.find((e) => e.id === eId && e.type === eType);
      if (exact) {
        return { name: exact.name, entityType: exact.type, detail: exact.detail || undefined };
      }
      // Fall back to fuzzy search (e.g., if ID is a name)
      const fuzzy = search(eId, { type: eType, limit: 1 });
      const f = fuzzy[0];
      if (f) {
        return { name: f.name, entityType: f.type, detail: f.detail || undefined };
      }
      return null;
    },
    [entities, search],
  );

  return useMemo(() => ({ resolveEntity }), [resolveEntity]);
}
