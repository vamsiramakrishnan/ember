/**
 * Thinker Card (2.5)
 * Introduction to a thinker entering the student's intellectual orbit.
 * Not a biography — a personal introduction with a monogram avatar.
 * See: 06-component-inventory.md, Family 2.
 */
import type { Thinker } from '@/types/entries';
import styles from './ThinkerCard.module.css';

interface ThinkerCardProps {
  thinker: Thinker;
  showBottomBorder?: boolean;
}

/** Extract initials for the monogram. */
function initials(name: string): string {
  return name.split(' ').map((w) => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
}

export function ThinkerCard({ thinker, showBottomBorder }: ThinkerCardProps) {
  return (
    <div className={showBottomBorder ? styles.containerBordered : styles.container}>
      <div className={styles.header}>
        <div className={styles.monogram} aria-hidden="true">
          {initials(thinker.name)}
        </div>
        <div className={styles.identity}>
          <span className={styles.name}>{thinker.name}</span>
          <span className={styles.dates}>{thinker.dates}</span>
        </div>
      </div>
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
    </div>
  );
}
