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
        <Text variant="pageTitle" as="h1" style={{ marginBottom: spacing.headerToContent }}>
          Constellation
        </Text>

        <section aria-label="Active threads">
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
        </section>

        <Rule margin={spacing.sectionGap} />

        <section aria-label="Fluency">
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
        </section>

        <Rule margin={spacing.sectionGap} />

        <section aria-label="Thinkers in orbit">
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
        </section>

        <div className={styles.spacer} />
      </div>
    </Column>
  );
}
