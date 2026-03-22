/**
 * NotebookCanvas — Canvas mode view within the Notebook surface.
 * Derives concept cards from actual notebook entries.
 * Supports mouse drag + touch drag for reposition.
 * Canvas cards are keyboard-accessible (arrow keys, tab).
 * See: 06-component-inventory.md, Family 4.
 */
import { useCallback, useRef } from 'react';
import { CanvasMode } from '@/components/canvas/CanvasMode';
import { Connector } from '@/components/canvas/Connector';
import { useCanvasPositions } from '@/hooks/useCanvasPositions';
import type { LiveEntry } from '@/types/entries';
import styles from './NotebookCanvas.module.css';

interface Props {
  sessionId: string | null;
  entries: LiveEntry[];
}

const ARROW_STEP = 10;

/** Extract a label and body from any entry type. */
function cardContent(e: LiveEntry): { label: string; body: string } | null {
  const entry = e.entry;
  switch (entry.type) {
    case 'prose': return { label: 'Thought', body: trunc(entry.content) };
    case 'scratch': return { label: 'Note', body: trunc(entry.content) };
    case 'hypothesis': return { label: 'Hypothesis', body: trunc(entry.content) };
    case 'question': return { label: 'Question', body: trunc(entry.content) };
    case 'tutor-marginalia': return { label: 'Tutor', body: trunc(entry.content) };
    case 'tutor-question': return { label: 'Probe', body: trunc(entry.content) };
    case 'tutor-connection': return { label: 'Connection', body: trunc(entry.content) };
    case 'tutor-reflection': return { label: 'Reflection', body: trunc(entry.content) };
    case 'tutor-directive': return { label: 'Explore', body: trunc(entry.content) };
    case 'bridge-suggestion': return { label: 'Bridge', body: trunc(entry.content) };
    case 'thinker-card': return { label: entry.thinker.name, body: entry.thinker.gift };
    case 'concept-diagram': return { label: 'Concept Map', body: entry.items.map((i) => i.label).join(' → ') };
    default: return null;
  }
}

function trunc(s: string, max = 100): string {
  return s.length > max ? s.slice(0, max) + '…' : s;
}

export function NotebookCanvas({ sessionId, entries }: Props) {
  const { positions, connections, updatePosition } = useCanvasPositions(sessionId, entries);
  const dragRef = useRef<{
    id: string; startX: number; startY: number;
    origX: number; origY: number;
  } | null>(null);

  const startDrag = useCallback((id: string, clientX: number, clientY: number) => {
    const pos = positions.find((p) => p.id === id);
    if (!pos) return;
    dragRef.current = { id, startX: clientX, startY: clientY, origX: pos.x, origY: pos.y };
  }, [positions]);

  const moveDrag = useCallback((clientX: number, clientY: number) => {
    if (!dragRef.current) return;
    const { id, startX, startY, origX, origY } = dragRef.current;
    updatePosition(id, origX + clientX - startX, origY + clientY - startY);
  }, [updatePosition]);

  const endDrag = useCallback(() => { dragRef.current = null; }, []);

  // Mouse handlers — document-level for drag outside card bounds
  const onMouseDown = useCallback((id: string, e: React.MouseEvent) => {
    e.preventDefault();
    startDrag(id, e.clientX, e.clientY);
    const onMove = (ev: MouseEvent) => moveDrag(ev.clientX, ev.clientY);
    const onUp = () => {
      endDrag();
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [startDrag, moveDrag, endDrag]);

  // Touch handlers — document-level so drag continues outside card bounds
  const onTouchStart = useCallback((id: string, e: React.TouchEvent) => {
    const t = e.touches[0];
    if (!t) return;
    startDrag(id, t.clientX, t.clientY);
    const onMove = (ev: TouchEvent) => {
      const touch = ev.touches[0];
      if (!touch || !dragRef.current) return;
      ev.preventDefault(); // prevent scroll only while actively dragging
      moveDrag(touch.clientX, touch.clientY);
    };
    const onEnd = () => {
      endDrag();
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onEnd);
    };
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onEnd);
  }, [startDrag, moveDrag, endDrag]);

  // Keyboard handler — arrow keys move the focused card
  const onKeyDown = useCallback((id: string, e: React.KeyboardEvent) => {
    const pos = positions.find((p) => p.id === id);
    if (!pos) return;
    let dx = 0, dy = 0;
    switch (e.key) {
      case 'ArrowUp': dy = -ARROW_STEP; break;
      case 'ArrowDown': dy = ARROW_STEP; break;
      case 'ArrowLeft': dx = -ARROW_STEP; break;
      case 'ArrowRight': dx = ARROW_STEP; break;
      default: return;
    }
    e.preventDefault();
    updatePosition(id, pos.x + dx, pos.y + dy);
  }, [positions, updatePosition]);

  const entryMap = new Map(entries.map((e) => [e.id, e]));

  // Calculate content bounds for proper scrollable area
  const maxX = positions.reduce((m, p) => Math.max(m, p.x + (p.width ?? 160) + 20), 400);
  const maxY = positions.reduce((m, p) => Math.max(m, p.y + 120), 300);

  return (
    <CanvasMode label="concept map" minHeight={Math.max(360, maxY)}>
      <div style={{ minWidth: maxX, minHeight: maxY }}>
        <svg className={styles.connectorLayer} style={{ width: maxX, height: maxY }}>
          {connections.map((conn) => {
            const from = positions.find((p) => p.id === conn.from);
            const to = positions.find((p) => p.id === conn.to);
            if (!from || !to) return null;
            return (
              <Connector
                key={`${conn.from}-${conn.to}`}
                x1={from.x + (from.width ?? 160) / 2} y1={from.y + 50}
                x2={to.x + (to.width ?? 160) / 2} y2={to.y + 10}
                label={conn.label} showArrow
              />
            );
          })}
        </svg>
        {positions.map((pos) => {
          const entry = entryMap.get(pos.id);
          if (!entry) return null;
          const card = cardContent(entry);
          if (!card) return null;
          return (
            <div
              key={pos.id}
              className={styles.card}
              style={{ left: pos.x, top: pos.y, width: pos.width ?? 160 }}
              tabIndex={0}
              role="button"
              aria-label={`${card.label}: ${card.body.slice(0, 40)}`}
              onMouseDown={(e) => onMouseDown(pos.id, e)}
              onTouchStart={(e) => onTouchStart(pos.id, e)}
              onKeyDown={(e) => onKeyDown(pos.id, e)}
            >
              <span className={styles.cardLabel}>{card.label}</span>
              <p className={styles.cardBody}>{card.body}</p>
            </div>
          );
        })}
      </div>
      {positions.length === 0 && (
        <p className={styles.empty}>Concepts will appear here as you explore</p>
      )}
    </CanvasMode>
  );
}
