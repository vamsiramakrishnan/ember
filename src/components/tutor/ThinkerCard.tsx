/**
 * Thinker Card (2.5)
 * Introduction to a thinker entering the student's orbit.
 *
 * Incremental reveal:
 *   Layer 0: monogram + name + dates (always visible)
 *   Layer 3 (click): Gift and Bridge sections expand below
 *
 * See: 06-component-inventory.md, Family 2.
 */
import { useState } from 'react';
import type { Thinker } from '@/types/entries';
import styles from './ThinkerCard.module.css';

interface ThinkerCardProps {
  thinker: Thinker;
  showBottomBorder?: boolean;
}

function initials(name: string): string {
  return name.split(' ').map((w) => w[0]).filter(Boolean)
    .slice(0, 2).join('').toUpperCase();
}

export function ThinkerCard({ thinker, showBottomBorder }: ThinkerCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`${showBottomBorder ? styles.containerBordered : styles.container} ${expanded ? styles.expanded : ''}`}
      onClick={() => setExpanded(!expanded)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setExpanded(!expanded);
        }
      }}
      aria-expanded={expanded}
    >
      {/* Layer 0: always visible */}
      <div className={styles.header}>
        <div className={styles.monogram} aria-hidden="true">
          {initials(thinker.name)}
        </div>
        <div className={styles.identity}>
          <span className={styles.name}>{thinker.name}</span>
          <span className={styles.dates}>{thinker.dates}</span>
        </div>
        <span className={styles.expandHint} aria-hidden="true">
          {expanded ? '−' : '+'}
        </span>
      </div>

      {/* Layer 3: Gift + Bridge revealed on click */}
      {expanded && (
        <div className={styles.body}>
          <div className={styles.section}>
            <span className={styles.sectionLabel}>The Gift</span>
            <p className={styles.gift}>{thinker.gift}</p>
          </div>
          <div className={styles.section}>
            <span className={styles.sectionLabel}>The Bridge</span>
            <p className={styles.bridge}>{thinker.bridge}</p>
          </div>
        </div>
      )}
    </div>
  );
}
