/**
 * Thinker Card (2.5)
 * Introduction to a thinker entering the student's intellectual orbit.
 * Not a biography — a personal introduction.
 * See: 06-component-inventory.md, Family 2.
 */
import type { Thinker } from '@/types/entries';
import styles from './ThinkerCard.module.css';

interface ThinkerCardProps {
  thinker: Thinker;
  showBottomBorder?: boolean;
}

export function ThinkerCard({ thinker, showBottomBorder }: ThinkerCardProps) {
  return (
    <div className={showBottomBorder ? styles.containerBordered : styles.container}>
      <div className={styles.nameRow}>
        <span className={styles.name}>{thinker.name}</span>
        <span className={styles.dates}>{thinker.dates}</span>
      </div>
      <p className={styles.gift}>{thinker.gift}</p>
      <p className={styles.bridge}>{thinker.bridge}</p>
    </div>
  );
}
