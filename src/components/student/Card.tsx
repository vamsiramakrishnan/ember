/**
 * Card (3.2)
 * Self-contained unit of information. The LEGO brick.
 * See: 06-component-inventory.md, Family 3.
 */
import { colors } from '@/tokens/colors';
import styles from './Card.module.css';

type AccentColor = 'margin' | 'sage' | 'indigo' | 'amber';

interface CardProps {
  title?: string;
  body: string;
  source?: string;
  accent?: AccentColor;
}

const accentMap: Record<AccentColor, string> = {
  margin: colors.margin,
  sage: colors.sage,
  indigo: colors.indigo,
  amber: colors.amber,
};

export function Card({ title, body, source, accent }: CardProps) {
  const borderTop = accent
    ? `2px solid ${accentMap[accent]}`
    : undefined;

  return (
    <div className={styles.card} style={borderTop ? { borderTop } : undefined}>
      {title && <div className={styles.title}>{title}</div>}
      <div className={styles.body}>{body}</div>
      {source && <div className={styles.source}>{source}</div>}
    </div>
  );
}
