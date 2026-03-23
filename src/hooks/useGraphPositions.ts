/**
 * useGraphPositions — persists and restores graph node positions.
 *
 * Uses localStorage keyed by notebookId. When the canvas is opened,
 * previously saved positions are restored so the layout is stable
 * across sessions.
 */
import { useEffect, useCallback, useRef } from 'react';
import type { GraphNode, LayoutNode, SavedPosition } from '@/types/graph-canvas';

const STORAGE_PREFIX = 'ember-graph-positions-';

function storageKey(notebookId: string): string {
  return `${STORAGE_PREFIX}${notebookId}`;
}

function loadPositions(notebookId: string): SavedPosition[] {
  try {
    const raw = localStorage.getItem(storageKey(notebookId));
    if (!raw) return [];
    return JSON.parse(raw) as SavedPosition[];
  } catch {
    return [];
  }
}

export function useGraphPositions(
  notebookId: string | null,
  _nodes: GraphNode[],
  onRestored: (positions: SavedPosition[]) => void,
) {
  const restoredRef = useRef(false);

  // Restore positions once when the notebook is opened
  useEffect(() => {
    if (!notebookId || restoredRef.current) return;
    const saved = loadPositions(notebookId);
    if (saved.length > 0) {
      onRestored(saved);
      restoredRef.current = true;
    }
  }, [notebookId, onRestored]);

  // Reset restoration flag when notebook changes
  useEffect(() => {
    restoredRef.current = false;
  }, [notebookId]);

  const savePositions = useCallback((layoutNodes: LayoutNode[]) => {
    if (!notebookId) return;
    const positions: SavedPosition[] = layoutNodes
      .filter((n) => n.pinned)
      .map((n) => ({ id: n.id, x: n.x, y: n.y, pinned: true }));
    try {
      localStorage.setItem(storageKey(notebookId), JSON.stringify(positions));
    } catch {
      // localStorage full — silently ignore
    }
  }, [notebookId]);

  return { savePositions };
}
