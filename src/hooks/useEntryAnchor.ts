/**
 * useEntryAnchor — registers a notebook entry's DOM element
 * in the entity navigation scroll registry.
 *
 * Every NotebookEntryWrapper calls this hook with its entry ID.
 * When someone navigates to that entry (from Constellation,
 * from a cross-reference, from an annotation link), the registry
 * resolves the ID to the DOM element and scrolls to it.
 */
import { useEffect, useRef } from 'react';
import { useEntityNavigation } from './useEntityNavigation';

export function useEntryAnchor(entryId: string) {
  const ref = useRef<HTMLDivElement>(null);
  const { registerAnchor, unregisterAnchor, highlightId } =
    useEntityNavigation();

  useEffect(() => {
    const el = ref.current;
    if (el) {
      registerAnchor(entryId, el);
    }
    return () => unregisterAnchor(entryId);
  }, [entryId, registerAnchor, unregisterAnchor]);

  const isHighlighted = highlightId === entryId;

  return { ref, isHighlighted };
}
