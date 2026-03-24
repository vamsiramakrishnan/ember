/**
 * LandingDemoCanvas — animated canvas scene.
 * Shows concept cards spatially arranged with bezier connectors,
 * demonstrating the spatial thinking mode.
 */
import { useState, useEffect } from 'react';
import styles from './LandingDemoCanvas.module.css';

interface Card {
  id: string;
  label: string;
  sub: string;
  x: number;
  y: number;
  color: 'amber' | 'indigo' | 'sage';
}

const CARDS: Card[] = [
  { id: 'kepler', label: 'Kepler', sub: 'harmonic ratios', x: 40, y: 30, color: 'amber' },
  { id: 'ellipse', label: 'Elliptical Orbits', sub: 'breaking the circle', x: 280, y: 15, color: 'indigo' },
  { id: 'tycho', label: 'Tycho\u2019s Data', sub: 'precision observation', x: 160, y: 140, color: 'sage' },
  { id: 'harmony', label: 'Harmonics', sub: 'beauty in mathematics', x: 420, y: 120, color: 'amber' },
  { id: 'newton', label: 'Newton', sub: 'gravitational law', x: 340, y: 240, color: 'indigo' },
];

const CONNECTORS: [string, string, string][] = [
  ['kepler', 'ellipse', 'discovered'],
  ['tycho', 'kepler', 'informed'],
  ['kepler', 'harmony', 'sought'],
  ['ellipse', 'newton', 'enabled'],
  ['harmony', 'newton', 'inspired'],
];

function cardPos(id: string): Card | undefined {
  return CARDS.find((c) => c.id === id);
}

interface Props { active: boolean; }

export function LandingDemoCanvas({ active }: Props) {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (!active) { setRevealed(false); return; }
    const t = setTimeout(() => setRevealed(true), 300);
    return () => clearTimeout(t);
  }, [active]);

  return (
    <div className={styles.canvas}>
      {/* SVG connectors */}
      <svg className={styles.connectors} aria-hidden="true">
        {revealed && CONNECTORS.map(([from, to, label], i) => {
          const a = cardPos(from);
          const b = cardPos(to);
          if (!a || !b) return null;
          const x1 = a.x + 65;
          const y1 = a.y + 25;
          const x2 = b.x + 65;
          const y2 = b.y + 25;
          const mx = (x1 + x2) / 2;
          const my = (y1 + y2) / 2 - 20;
          return (
            <g key={i} className={styles.connector}
              style={{ animationDelay: `${600 + i * 200}ms` }}>
              <path
                d={`M${x1},${y1} Q${mx},${my} ${x2},${y2}`}
                fill="none" stroke="var(--rule)" strokeWidth="1"
              />
              <text x={mx} y={my + 4}
                className={styles.connLabel}>{label}</text>
            </g>
          );
        })}
      </svg>

      {/* Concept cards */}
      {CARDS.map((card, i) => (
        <div
          key={card.id}
          className={`${styles.card} ${styles[card.color]} ${revealed ? styles.cardRevealed : ''}`}
          style={{
            left: card.x,
            top: card.y,
            transitionDelay: `${i * 120}ms`,
          }}
        >
          <div className={styles.cardLabel}>{card.label}</div>
          <div className={styles.cardSub}>{card.sub}</div>
        </div>
      ))}

      {/* Mode indicator */}
      <div className={styles.modeBar}>
        <span className={styles.modeInactive}>linear</span>
        <span className={styles.modeActive}>canvas</span>
        <span className={styles.modeInactive}>graph</span>
      </div>
    </div>
  );
}
