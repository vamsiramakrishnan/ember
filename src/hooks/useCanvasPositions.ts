/**
 * useCanvasPositions — spatial positions for canvas mode.
 * Persists to IndexedDB via canvas repository.
 * Derives initial positions from notebook entries if no saved state.
 */
import { useState, useCallback, useEffect, useRef } from 'react';
import { saveCanvasState, getCanvasBySession } from '@/persistence/repositories/canvas';
import type { CanvasPosition, CanvasConnection } from '@/types/canvas';
import type { LiveEntry } from '@/types/entries';

/** Entry types that become canvas cards. */
const CARD_TYPES = new Set([
  'prose', 'hypothesis', 'question', 'tutor-connection',
  'concept-diagram', 'thinker-card', 'bridge-suggestion',
]);

/** Extract card-worthy entries and auto-position them. */
function derivePositions(entries: LiveEntry[]): CanvasPosition[] {
  const cards = entries.filter((e) => CARD_TYPES.has(e.entry.type));
  const cols = 3;
  const cardW = 200;
  const gapX = 40;
  const gapY = 40;
  return cards.map((e, i) => ({
    id: e.id,
    x: 40 + (i % cols) * (cardW + gapX),
    y: 30 + Math.floor(i / cols) * (100 + gapY),
    width: cardW,
  }));
}

export function useCanvasPositions(
  sessionId: string | null,
  entries: LiveEntry[],
) {
  const [positions, setPositions] = useState<CanvasPosition[]>([]);
  const [connections, setConnections] = useState<CanvasConnection[]>([]);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();

  // Load saved state or derive from entries
  useEffect(() => {
    if (!sessionId) return;
    getCanvasBySession(sessionId).then((saved) => {
      if (saved && saved.positions.length > 0) {
        setPositions(saved.positions);
        setConnections(saved.connections);
      } else {
        setPositions(derivePositions(entries));
      }
    });
  }, [sessionId, entries.length]); // re-derive when entries change

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

  return { positions, connections, updatePosition };
}
