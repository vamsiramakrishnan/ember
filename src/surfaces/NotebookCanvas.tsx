/**
 * NotebookCanvas — Canvas mode view within the Notebook surface.
 * Derives concept cards from actual notebook entries.
 * Positions persist to IndexedDB per session.
 * See: 06-component-inventory.md, Family 4.
 */
import { useCallback } from 'react';
import { CanvasMode } from '@/components/canvas/CanvasMode';
import { Connector } from '@/components/canvas/Connector';
import { useCanvasPositions } from '@/hooks/useCanvasPositions';
import type { LiveEntry } from '@/types/entries';
import styles from './NotebookCanvas.module.css';

interface Props {
  sessionId: string | null;
  entries: LiveEntry[];
}

/** Extract a label and body from any entry type. */
function cardContent(entry: LiveEntry): { label: string; body: string } | null {
  const e = entry.entry;
  switch (e.type) {
    case 'prose': return { label: 'Thought', body: truncate(e.content) };
    case 'scratch': return { label: 'Note', body: truncate(e.content) };
    case 'hypothesis': return { label: 'Hypothesis', body: truncate(e.content) };
    case 'question': return { label: 'Question', body: truncate(e.content) };
    case 'tutor-marginalia': return { label: 'Tutor', body: truncate(e.content) };
    case 'tutor-question': return { label: 'Probe', body: truncate(e.content) };
    case 'tutor-connection': return { label: 'Connection', body: truncate(e.content) };
    case 'tutor-reflection': return { label: 'Reflection', body: truncate(e.content) };
    case 'bridge-suggestion': return { label: 'Bridge', body: truncate(e.content) };
    case 'thinker-card': return { label: e.thinker.name, body: e.thinker.gift };
    case 'concept-diagram': {
      const labels = e.items.map((i) => i.label).join(' → ');
      return { label: 'Concept Map', body: labels };
    }
    default: return null;
  }
}

function truncate(s: string, max = 120): string {
  return s.length > max ? s.slice(0, max) + '…' : s;
}

export function NotebookCanvas({ sessionId, entries }: Props) {
  const { positions, connections, updatePosition } = useCanvasPositions(sessionId, entries);

  const handleDrag = useCallback(
    (id: string, e: React.MouseEvent) => {
      e.preventDefault();
      const startX = e.clientX;
      const startY = e.clientY;
      const pos = positions.find((p) => p.id === id);
      if (!pos) return;
      const origX = pos.x;
      const origY = pos.y;

      const onMove = (ev: MouseEvent) => {
        updatePosition(id, origX + ev.clientX - startX, origY + ev.clientY - startY);
      };
      const onUp = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    },
    [positions, updatePosition],
  );

  // Build card data from entries that have positions
  const entryMap = new Map(entries.map((e) => [e.id, e]));

  return (
    <CanvasMode label="concept map" minHeight={360}>
      <svg className={styles.connectorLayer}>
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
            onMouseDown={(e) => handleDrag(pos.id, e)}
          >
            <span className={styles.cardLabel}>{card.label}</span>
            <p className={styles.cardBody}>{card.body}</p>
          </div>
        );
      })}
      {positions.length === 0 && (
        <p className={styles.empty}>
          Concepts will appear here as you explore
        </p>
      )}
    </CanvasMode>
  );
}
