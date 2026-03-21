/**
 * Mastery Bar (5.3)
 * Thin indicator of fluency. Appears only in Constellation.
 * See: 06-component-inventory.md, Family 5.
 */
import { colors } from '@/tokens/colors';
import type { MasteryLevel } from '@/types/mastery';
import styles from './MasteryBar.module.css';

interface MasteryBarProps {
  concept: string;
  level: MasteryLevel;
  percentage: number;
}

const levelColors: Record<MasteryLevel, string> = {
  mastered: colors.sage,
  strong: colors.ink,
  developing: colors.indigo,
  exploring: colors.inkGhost,
};

export function MasteryBar({ concept, level, percentage }: MasteryBarProps) {
  return (
    <div className={styles.container}>
      <div className={styles.concept}>{concept}</div>
      <div className={styles.barRow}>
        <div className={styles.track}>
          <div
            className={styles.fill}
            style={{
              width: `${percentage}%`,
              backgroundColor: levelColors[level],
            }}
          />
        </div>
        <span className={styles.label}>{percentage}%</span>
      </div>
    </div>
  );
}
