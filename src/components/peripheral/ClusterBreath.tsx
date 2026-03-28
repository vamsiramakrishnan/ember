/**
 * ClusterBreath — ghost separator between conversation clusters.
 * A thin rule-light line that appears on hover between thought groups,
 * invisible at rest and during scroll. Creates breathing room.
 */
import styles from './ClusterBreath.module.css';

export function ClusterBreath() {
  return (
    <div className={styles.breath} aria-hidden="true">
      <div className={styles.line} />
    </div>
  );
}
