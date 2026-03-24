/**
 * useCanvasPositions — spatial positions for canvas mode.
 * Persists to IndexedDB via canvas repository.
 * Derives initial positions from notebook entries if no saved state.
 *
 * Fix: new entries are appended to existing positions instead of
 * re-deriving from scratch, preserving user-dragged positions.
 */
import { useState, useCallback, useEffect, useRef } from 'react';
import { saveCanvasState, getCanvasBySession } from '@/persistence/repositories/canvas';
import type { CanvasPosition, CanvasConnection } from '@/types/canvas';
import type { LiveEntry } from '@/types/entries';

/** Entry types that become canvas cards. */
const CARD_TYPES = new Set([
  'prose', 'hypothesis', 'question', 'scratch',
  'tutor-marginalia', 'tutor-question', 'tutor-connection',
  'concept-diagram', 'thinker-card', 'bridge-suggestion',
  'tutor-reflection',
]);

/** Derive a position for a single entry at a given index. */
function positionForEntry(entryId: string, index: number): CanvasPosition {
  const cols = 3;
  const cardW = 200;
  const gapX = 40;
  const gapY = 40;
  return {
    id: entryId,
    x: 40 + (index % cols) * (cardW + gapX),
    y: 30 + Math.floor(index / cols) * (100 + gapY),
    width: cardW,
  };
}

export function useCanvasPositions(
  sessionId: string | null,
  entries: LiveEntry[],
) {
  const [positions, setPositions] = useState<CanvasPosition[]>([]);
  const [connections, setConnections] = useState<CanvasConnection[]>([]);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();
  const loadedSessionRef = useRef<string | null>(null);

  // Load saved state when session changes
  useEffect(() => {
    if (!sessionId || sessionId === loadedSessionRef.current) return;
    loadedSessionRef.current = sessionId;

    getCanvasBySession(sessionId).then((saved) => {
      if (saved && saved.positions.length > 0) {
        setPositions(saved.positions);
        setConnections(saved.connections);
      } else {
        const cards = entries.filter((e) => CARD_TYPES.has(e.entry.type));
        setPositions(cards.map((e, i) => positionForEntry(e.id, i)));
      }
    });
    // Only run on session change, not entries change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  // Append positions for NEW entries without re-deriving existing ones.
  // This preserves user-dragged card positions.
  useEffect(() => {
    const cardEntries = entries.filter((e) => CARD_TYPES.has(e.entry.type));
    const existingIds = new Set(positions.map((p) => p.id));
    const newEntries = cardEntries.filter((e) => !existingIds.has(e.id));

    if (newEntries.length === 0) return;

    setPositions((prev) => {
      const startIdx = prev.length;
      const additions = newEntries.map((e, i) =>
        positionForEntry(e.id, startIdx + i),
      );
      return [...prev, ...additions];
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries]);

  const updatePosition = useCallback(
    (id: string, x: number, y: number) => {
      setPositions((prev) => {
        const next = prev.map((p) => (p.id === id ? { ...p, x, y } : p));
        // Debounced persist
        if (saveTimer.current) clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => {
          if (sessionId) void saveCanvasState({ sessionId, positions: next, connections });
        }, 500);
        return next;
      });
    },
    [sessionId, connections],
  );

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  return { positions, connections, updatePosition };
}
