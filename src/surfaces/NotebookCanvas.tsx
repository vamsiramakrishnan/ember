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
import { useMetaLabels } from '@/hooks/useMetaLabels';
import { cardContent, cardAccent } from './canvas-helpers';
import type { LiveEntry } from '@/types/entries';
import styles from './NotebookCanvas.module.css';

interface Props {
  sessionId: string | null;
  entries: LiveEntry[];
  /** Cross-mode navigation: click a card to switch to linear + scroll to entry. */
  onCardClick?: (entryId: string, label: string) => void;
}

const ARROW_STEP = 10;

export function NotebookCanvas({ sessionId, entries, onCardClick }: Props) {
  const { positions, connections, updatePosition } = useCanvasPositions(sessionId, entries);
  const { getLabel } = useMetaLabels(entries);
  const dragRef = useRef<{
    id: string; startX: number; startY: number; origX: number; origY: number;
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

  // Click-to-navigate: if user clicks without dragging, navigate to source entry.
  // Track mousedown position; if mouseup is within 5px, treat as click not drag.
  const clickStart = useRef<{ id: string; x: number; y: number } | null>(null);
  const onClickEnd = useCallback((id: string, x: number, y: number) => {
    if (!clickStart.current || clickStart.current.id !== id) return;
    const dx = Math.abs(x - clickStart.current.x);
    const dy = Math.abs(y - clickStart.current.y);
    if (dx < 5 && dy < 5 && onCardClick) {
      const entry = entries.find((e) => e.id === id);
      const card = entry ? cardContent(entry) : null;
      onCardClick(id, card?.label ?? 'entry');
    }
    clickStart.current = null;
  }, [onCardClick, entries]);

  const onMouseDown = useCallback((id: string, e: React.MouseEvent) => {
    e.preventDefault();
    clickStart.current = { id, x: e.clientX, y: e.clientY };
    startDrag(id, e.clientX, e.clientY);
    const onMove = (ev: MouseEvent) => moveDrag(ev.clientX, ev.clientY);
    const onUp = (ev: MouseEvent) => {
      onClickEnd(id, ev.clientX, ev.clientY);
      endDrag();
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [startDrag, moveDrag, endDrag, onClickEnd]);

  const onTouchStart = useCallback((id: string, e: React.TouchEvent) => {
    const t = e.touches[0];
    if (!t) return;
    clickStart.current = { id, x: t.clientX, y: t.clientY };
    startDrag(id, t.clientX, t.clientY);
    const onMove = (ev: TouchEvent) => {
      const touch = ev.touches[0];
      if (!touch || !dragRef.current) return;
      ev.preventDefault();
      moveDrag(touch.clientX, touch.clientY);
    };
    const onEnd = (ev: TouchEvent) => {
      const touch = ev.changedTouches[0];
      if (touch) onClickEnd(id, touch.clientX, touch.clientY);
      endDrag();
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onEnd);
    };
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onEnd);
  }, [startDrag, moveDrag, endDrag, onClickEnd]);

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
          const accent = cardAccent(entry.entry.type);
          const cls = [styles.card, accent ? styles[accent] : ''].filter(Boolean).join(' ');
          return (
            <div
              key={pos.id} className={cls}
              style={{ left: pos.x, top: pos.y, width: pos.width ?? 180 }}
              tabIndex={0} role="button"
              aria-label={`${card.label}: ${card.body.slice(0, 40)}`}
              onMouseDown={(e) => onMouseDown(pos.id, e)}
              onTouchStart={(e) => onTouchStart(pos.id, e)}
              onKeyDown={(e) => onKeyDown(pos.id, e)}
            >
              {(() => {
                const meta = getLabel(pos.id);
                return (
                  <>
                    <span className={styles.cardLabel}>{meta?.title ?? card.label}</span>
                    <p className={styles.cardBody}>{card.body}</p>
                    {meta?.tags && meta.tags.length > 0 && (
                      <span className={styles.cardTags}>{meta.tags.join(' \u00b7 ')}</span>
                    )}
                  </>
                );
              })()}
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
