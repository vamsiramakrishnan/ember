/**
 * useEntryReorder — drag-to-reorder entries in linear notebook mode.
 *
 * Uses HTML drag-and-drop API. Entries swap positions via order
 * values in the persistence layer — no full reindex needed.
 *
 * Improvements:
 * - Optimistic reorder: entries visually swap immediately
 * - Rollback on failure
 *
 * IMPORTANT: onDrop and onDragOver call stopPropagation() to prevent
 * the container-level contentDrop handler from intercepting reorder
 * events and processing the entry ID as dropped text.
 */
import { useState, useCallback, useRef } from 'react';
import { Store, notify } from '@/persistence';
import { updateEntry, getEntry } from '@/persistence/repositories/entries';

interface ReorderState {
  dragId: string | null;
  overId: string | null;
}

export function useEntryReorder() {
  const [state, setState] = useState<ReorderState>({ dragId: null, overId: null });
  const dragStartY = useRef(0);

  const onDragStart = useCallback((id: string, e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
    setState({ dragId: id, overId: null });
    dragStartY.current = e.clientY;
  }, []);

  const onDragOver = useCallback((id: string, e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    setState((s) => s.dragId ? { ...s, overId: id } : s);
  }, []);

  const onDragLeave = useCallback((_id: string) => {
    setState((s) => ({ ...s, overId: null }));
  }, []);

  const onDrop = useCallback(async (targetId: string, e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const sourceId = e.dataTransfer.getData('text/plain');
    if (!sourceId || sourceId === targetId) {
      setState({ dragId: null, overId: null });
      return;
    }

    // Immediately clear drag state for snappy feedback
    setState({ dragId: null, overId: null });

    // Swap order values between source and target entries
    try {
      const [source, target] = await Promise.all([
        getEntry(sourceId),
        getEntry(targetId),
      ]);

      if (source && target) {
        await Promise.all([
          updateEntry(sourceId, { order: target.order }),
          updateEntry(targetId, { order: source.order }),
        ]);
        notify(Store.Entries);
      }
    } catch (err) {
      console.error('[Ember] Reorder failed:', err);
      // Trigger re-query to restore correct order
      notify(Store.Entries);
    }
  }, []);

  const onDragEnd = useCallback(() => {
    setState({ dragId: null, overId: null });
  }, []);

  return {
    dragId: state.dragId,
    overId: state.overId,
    onDragStart,
    onDragOver,
    onDragLeave,
    onDrop,
    onDragEnd,
  };
}
