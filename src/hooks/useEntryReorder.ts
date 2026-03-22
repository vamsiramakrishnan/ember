/**
 * useEntryReorder — drag-to-reorder entries in linear notebook mode.
 *
 * Uses HTML drag-and-drop API with touch fallback via pointer events.
 * Entries swap positions via fractional indexing in the persistence
 * layer — no full reindex needed.
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
    e.dataTransfer.dropEffect = 'move';
    setState((s) => s.dragId ? { ...s, overId: id } : s);
  }, []);

  const onDragLeave = useCallback((_id: string) => {
    setState((s) => ({ ...s, overId: null }));
  }, []);

  const onDrop = useCallback(async (targetId: string, e: React.DragEvent) => {
    e.preventDefault();
    const sourceId = e.dataTransfer.getData('text/plain');
    if (!sourceId || sourceId === targetId) {
      setState({ dragId: null, overId: null });
      return;
    }

    // Swap order values
    const [source, target] = await Promise.all([
      getEntry(sourceId),
      getEntry(targetId),
    ]);

    if (source && target) {
      await Promise.all([
        updateEntry(sourceId, { order: target.order } as Partial<typeof source>),
        updateEntry(targetId, { order: source.order } as Partial<typeof target>),
      ]);
      notify(Store.Entries);
    }

    setState({ dragId: null, overId: null });
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
