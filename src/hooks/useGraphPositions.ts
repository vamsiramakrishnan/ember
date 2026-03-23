/**
 * useGraphPositions — persists graph node positions to IndexedDB.
 * Uses the canvas store with key convention `graph:{notebookId}`
 * to avoid schema migration while reusing the existing Canvas store.
 *
 * Only pinned (user-dragged) nodes are saved. Positions are restored
 * on mount and saved with a 500ms debounce after drag events.
 */
import { useEffect, useRef, useCallback } from 'react';
import {
  saveCanvasState,
  getCanvasBySession,
} from '@/persistence/repositories/canvas';
import type { GraphNode } from '@/types/graph-canvas';

/** Map of node ID to { x, y } positions for restoration. */
export type PositionMap = Map<string, { x: number; y: number }>;

const SAVE_DEBOUNCE_MS = 500;

export function useGraphPositions(
  notebookId: string,
  onRestored: (positions: PositionMap) => void,
) {
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const restoredRef = useRef(false);
  const onRestoredRef = useRef(onRestored);
  onRestoredRef.current = onRestored;

  // ── Restore positions on mount / notebook change ────────
  useEffect(() => {
    if (!notebookId) return;
    restoredRef.current = false;

    const key = `graph:${notebookId}`;
    void getCanvasBySession(key).then(saved => {
      if (!saved || restoredRef.current) return;
      const posMap: PositionMap = new Map();
      for (const p of saved.positions) {
        posMap.set(p.id, { x: p.x, y: p.y });
      }
      onRestoredRef.current(posMap);
      restoredRef.current = true;
    });
  }, [notebookId]);

  // ── Save positions (debounced) ──────────────────────────
  const savePositions = useCallback(
    (currentNodes: GraphNode[]) => {
      if (!notebookId) return;
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

      saveTimeoutRef.current = setTimeout(() => {
        const positions = currentNodes
          .filter(n => n.pinned)
          .map(n => ({ id: n.id, x: n.x, y: n.y }));

        void saveCanvasState({
          sessionId: `graph:${notebookId}`,
          positions,
          connections: [],
        });
      }, SAVE_DEBOUNCE_MS);
    },
    [notebookId],
  );

  // ── Cleanup pending timeout on unmount ──────────────────
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  return { savePositions };
}
