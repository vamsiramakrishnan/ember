/**
 * ChipPreviewCard — floating preview that appears when hovering a MentionChip.
 * Shows entity details: name, type, description, mastery, cross-references.
 * Positioned above the chip, fades in after a brief delay.
 * Quiet and warm — feels like a margin note, not a tooltip.
 */
import type { EntityPreview } from './ChipContext';
import styles from './ChipPreviewCard.module.css';

interface ChipPreviewCardProps {
  data: EntityPreview;
}

const LEVEL_LABELS: Record<string, string> = {
  mastered: 'mastered',
  strong: 'strong',
  developing: 'developing',
  exploring: 'exploring',
};

const LEVEL_ACCENT: Record<string, string> = {
  mastered: styles.masteryMastered ?? '',
  strong: styles.masteryStrong ?? '',
  developing: styles.masteryDeveloping ?? '',
  exploring: styles.masteryExploring ?? '',
};

export function ChipPreviewCard({ data }: ChipPreviewCardProps) {
  const hasDetail = data.detail || data.dates || data.tradition;
  const hasMastery = data.mastery && data.mastery.percentage > 0;

  return (
    <div className={styles.card} role="tooltip">
      <div className={styles.header}>
        <span className={styles.name}>{data.name}</span>
        <span className={styles.kind}>{data.entityType}</span>
      </div>

      {data.dates && (
        <span className={styles.dates}>{data.dates}</span>
      )}

      {hasDetail && (
        <p className={styles.detail}>
          {data.tradition && <span className={styles.tradition}>{data.tradition} · </span>}
          {data.detail}
        </p>
      )}

      {hasMastery && data.mastery && (
        <div className={styles.masteryRow}>
          <div className={styles.masteryTrack}>
            <div
              className={`${styles.masteryFill} ${LEVEL_ACCENT[data.mastery.level] ?? ''}`}
              style={{ width: `${data.mastery.percentage}%` }}
            />
          </div>
          <span className={styles.masteryLabel}>
            {LEVEL_LABELS[data.mastery.level] ?? data.mastery.level}
          </span>
        </div>
      )}

      {data.crossReferences && data.crossReferences.length > 0 && (
        <div className={styles.refs}>
          {data.crossReferences.slice(0, 3).map((ref) => (
            <span key={ref} className={styles.ref}>{ref}</span>
          ))}
        </div>
      )}
    </div>
  );
}
