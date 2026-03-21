/**
 * Constellation — Surface 2: The Bookshelf
 * The student's intellectual map.
 * See: 04-information-architecture.md, Surface two.
 */
import { Column } from '@/primitives/Column';
import { Text } from '@/primitives/Text';
import { Rule } from '@/primitives/Rule';
import { MasteryBar } from '@/components/peripheral/MasteryBar';
import { BridgeSuggestion } from '@/components/peripheral/BridgeSuggestion';
import { ThinkerCard } from '@/components/tutor/ThinkerCard';
import { PinnedThread } from '@/components/student/PinnedThread';
import { useMasteryData } from '@/hooks/useMasteryData';
import { spacing } from '@/tokens/spacing';
import styles from './Constellation.module.css';

export function Constellation() {
  const { concepts, threads, thinkers } = useMasteryData();
  const hasMastered = concepts.some((c) => c.level === 'mastered');

  return (
    <Column>
      <div className={styles.container}>
        <Text variant="pageTitle" as="h1" style={{ marginBottom: 8 }}>
          Constellation
        </Text>
        <Text
          variant="bodySecondary"
          as="p"
          style={{ marginBottom: spacing.headerToContent }}
        >
          Your intellectual map — the concepts explored, the questions
          carried, and the thinkers in your orbit.
        </Text>

        <Text
          variant="sectionLabel"
          as="h2"
          className={styles.sectionLabel}
          style={{ marginBottom: spacing.labelToContent }}
        >
          Active Threads
        </Text>
        {threads.map((t, i) => (
          <PinnedThread key={i}>{t.question}</PinnedThread>
        ))}

        <Rule margin={spacing.sectionGap} />

        <Text
          variant="sectionLabel"
          as="h2"
          className={styles.sectionLabel}
          style={{ marginBottom: spacing.labelToContent }}
        >
          Fluency
        </Text>
        {concepts.map((c) => (
          <MasteryBar
            key={c.concept}
            concept={c.concept}
            level={c.level}
            percentage={c.percentage}
          />
        ))}

        {hasMastered && (
          <BridgeSuggestion>
            Your understanding of harmonic ratios connects to
            Fourier's discovery that any wave can be decomposed
            into simple harmonics — the same mathematics, applied
            to heat, light, and sound.
          </BridgeSuggestion>
        )}

        <Rule margin={spacing.sectionGap} />

        <Text
          variant="sectionLabel"
          as="h2"
          className={styles.sectionLabel}
          style={{ marginBottom: spacing.labelToContent }}
        >
          Thinkers in Orbit
        </Text>
        {thinkers.map((t, i) => (
          <ThinkerCard
            key={t.name}
            thinker={t}
            showBottomBorder={i < thinkers.length - 1}
          />
        ))}

        <div className={styles.spacer} />
      </div>
    </Column>
  );
}
