/**
 * MasteryTips (5.6) — quiet review suggestions in the Constellation overview.
 * Shows actionable tips based on mastery state: what to review, what to deepen.
 * Never gamified, never loud. Just gentle suggestions like margin notes.
 */
import { useMemo } from 'react';
import { Text } from '@/primitives/Text';
import styles from './MasteryTips.module.css';

interface MasteryItem {
  concept: string;
  level: string;
  percentage: number;
}

interface Props {
  concepts: MasteryItem[];
}

interface Tip {
  text: string;
  accent: 'sage' | 'indigo' | 'amber' | 'margin';
}

export function MasteryTips({ concepts }: Props) {
  const tips = useMemo(() => deriveTips(concepts), [concepts]);

  if (tips.length === 0) return null;

  return (
    <div className={styles.container} aria-label="Study suggestions">
      <Text variant="sectionLabel" as="h3" className={styles.label}>
        Quiet Suggestions
      </Text>
      {tips.map((tip, i) => (
        <p key={i} className={`${styles.tip} ${styles[tip.accent] ?? ''}`}>
          {tip.text}
        </p>
      ))}
    </div>
  );
}

function deriveTips(concepts: MasteryItem[]): Tip[] {
  const tips: Tip[] = [];
  if (concepts.length === 0) return tips;

  // Stale concepts: developing for a while (low percentage in developing)
  const stale = concepts.filter((c) => c.level === 'developing' && c.percentage < 40);
  const firstStale = stale[0];
  if (firstStale) {
    tips.push({
      text: `Try explaining *${firstStale.concept}* in your own words — teaching it reveals what you actually know.`,
      accent: 'margin',
    });
  }

  // Strong but not mastered: close to breakthrough
  const almostThere = concepts.filter((c) => c.level === 'strong' && c.percentage >= 70);
  const firstAlmost = almostThere[0];
  if (firstAlmost) {
    tips.push({
      text: `You're close with *${firstAlmost.concept}*. What are its limits? Where does it break down?`,
      accent: 'sage',
    });
  }

  // Exploring: very new concepts that need attention
  const fresh = concepts.filter((c) => c.level === 'exploring');
  if (fresh.length >= 2) {
    tips.push({
      text: `You've just encountered ${fresh.map((c) => c.concept).join(' and ')}. Try connecting them — what do they share?`,
      accent: 'indigo',
    });
  }

  // Gap detection: if all concepts are at similar levels, suggest going deeper
  const first = concepts[0];
  const allSameLevel = concepts.length > 2 && first &&
    concepts.every((c) => c.level === first.level);
  if (allSameLevel && first && first.level !== 'mastered') {
    tips.push({
      text: 'Your understanding is even across topics. Pick one and go deep — mastery comes from depth, not breadth.',
      accent: 'amber',
    });
  }

  return tips.slice(0, 3); // Never more than 3 tips — quiet, not overwhelming
}
