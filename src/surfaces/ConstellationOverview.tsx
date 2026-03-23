/**
 * ConstellationOverview — the default view of the Constellation surface.
 * Shows active threads, fluency mastery bars, and thinkers in orbit.
 * Extracted from Constellation.tsx for 150-line discipline.
 */
import { Text } from '@/primitives/Text';
import { Rule } from '@/primitives/Rule';
import { MasteryBar } from '@/components/peripheral/MasteryBar';
import { MasteryTips } from '@/components/peripheral/MasteryTips';
import { BridgeSuggestion } from '@/components/peripheral/BridgeSuggestion';
import { ThinkerCard } from '@/components/tutor/ThinkerCard';
import { PinnedThread } from '@/components/student/PinnedThread';
import { spacing } from '@/tokens/spacing';
import type { useMasteryData } from '@/hooks/useMasteryData';
import styles from './Constellation.module.css';

interface Props {
  concepts: ReturnType<typeof useMasteryData>['concepts'];
  threads: ReturnType<typeof useMasteryData>['threads'];
  thinkers: ReturnType<typeof useMasteryData>['thinkers'];
}

export function ConstellationOverview({ concepts, threads, thinkers }: Props) {
  return (
    <>
      <section aria-label="Active threads">
        <Text variant="sectionLabel" as="h2" className={styles.sectionLabel}
          style={{ marginBottom: spacing.labelToContent }}>
          Active Threads
        </Text>
        {threads.map((t, i) => (
          <PinnedThread key={i}>{t.question}</PinnedThread>
        ))}
      </section>
      <Rule margin={spacing.sectionGap} />
      <section aria-label="Fluency">
        <Text variant="sectionLabel" as="h2" className={styles.sectionLabel}
          style={{ marginBottom: spacing.labelToContent }}>
          Fluency
        </Text>
        {concepts.map((c) => (
          <MasteryBar key={c.concept} concept={c.concept}
            level={c.level} percentage={c.percentage} />
        ))}
        <MasteryTips concepts={concepts} />
        {threads.length > 0 && (
          <BridgeSuggestion>
            {threads[0]?.question ?? ''}
          </BridgeSuggestion>
        )}
      </section>
      <Rule margin={spacing.sectionGap} />
      <section aria-label="Thinkers in orbit">
        <Text variant="sectionLabel" as="h2" className={styles.sectionLabel}
          style={{ marginBottom: spacing.labelToContent }}>
          Thinkers in Orbit
        </Text>
        {thinkers.map((t, i) => (
          <ThinkerCard key={t.name} thinker={t}
            showBottomBorder={i < thinkers.length - 1} />
        ))}
      </section>
    </>
  );
}
