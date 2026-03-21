/**
 * NotebookCanvas — Canvas mode view within the Notebook surface.
 * Spatial arrangement of the student's key concepts from the session.
 * Drawn from prototype Screen 2 (Transmutations Canvas).
 */
import { CanvasMode } from '@/components/canvas/CanvasMode';
import { Connector } from '@/components/canvas/Connector';
import { useCanvasPositions } from '@/hooks/useCanvasPositions';
import type { CanvasPosition, CanvasConnection } from '@/types/canvas';
import styles from './NotebookCanvas.module.css';

const initialPositions: CanvasPosition[] = [
  { id: 'guitar', x: 60, y: 40, width: 200 },
  { id: 'kepler', x: 320, y: 30, width: 200 },
  { id: 'harmony', x: 180, y: 180, width: 220 },
  { id: 'orbit', x: 420, y: 190, width: 180 },
];

const connections: CanvasConnection[] = [
  { from: 'guitar', to: 'harmony', label: 'frequency ratios' },
  { from: 'kepler', to: 'harmony', label: 'Musica Universalis' },
  { from: 'harmony', to: 'orbit', label: 'period ∝ distance³ᐟ²' },
];

const cardContent: Record<string, { label: string; body: string }> = {
  guitar: {
    label: 'Guitar String',
    body: 'Harmonics are all about ratios — octave is 2:1, fifth is 3:2.',
  },
  kepler: {
    label: 'Kepler',
    body: 'Believed planets were singing. Each orbit produced a tone.',
  },
  harmony: {
    label: 'Harmonic Series',
    body: 'The same mathematical structure underlies both music and orbits.',
  },
  orbit: {
    label: 'Orbital Period',
    body: 'Longer string = lower note. Bigger orbit = longer period.',
  },
};

export function NotebookCanvas() {
  const { positions } = useCanvasPositions(initialPositions);

  return (
    <CanvasMode label="concept map" minHeight={340}>
      <svg className={styles.connectorLayer}>
        {connections.map((conn) => {
          const from = positions.find((p) => p.id === conn.from);
          const to = positions.find((p) => p.id === conn.to);
          if (!from || !to) return null;
          return (
            <Connector
              key={`${conn.from}-${conn.to}`}
              x1={from.x + (from.width ?? 160) / 2}
              y1={from.y + 50}
              x2={to.x + (to.width ?? 160) / 2}
              y2={to.y + 10}
              label={conn.label}
              showArrow
            />
          );
        })}
      </svg>
      {positions.map((pos) => {
        const card = cardContent[pos.id];
        if (!card) return null;
        return (
          <div
            key={pos.id}
            className={styles.card}
            style={{
              left: pos.x,
              top: pos.y,
              width: pos.width ?? 160,
            }}
          >
            <span className={styles.cardLabel}>{card.label}</span>
            <p className={styles.cardBody}>{card.body}</p>
          </div>
        );
      })}
    </CanvasMode>
  );
}
