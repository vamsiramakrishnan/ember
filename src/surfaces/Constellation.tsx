/**
 * Constellation — Surface 2: The Bookshelf
 * The student's intellectual map. Enriched with Lexicon,
 * Encounters, and Library drawn from prototypes.
 * See: 04-information-architecture.md, Surface two.
 */
import { useState } from 'react';
import { Column } from '@/primitives/Column';
import { Text } from '@/primitives/Text';
import { Rule } from '@/primitives/Rule';
import { MasteryBar } from '@/components/peripheral/MasteryBar';
import { BridgeSuggestion } from '@/components/peripheral/BridgeSuggestion';
import { ThinkerCard } from '@/components/tutor/ThinkerCard';
import { PinnedThread } from '@/components/student/PinnedThread';
import { useMasteryData } from '@/hooks/useMasteryData';
import { spacing } from '@/tokens/spacing';
import { ConstellationLexicon } from './ConstellationLexicon';
import { ConstellationEncounters } from './ConstellationEncounters';
import { ConstellationLibrary } from './ConstellationLibrary';
import styles from './Constellation.module.css';

type ConstellationView = 'overview' | 'lexicon' | 'encounters' | 'library';

const viewTabs: { id: ConstellationView; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'lexicon', label: 'Lexicon' },
  { id: 'encounters', label: 'Encounters' },
  { id: 'library', label: 'Library' },
];

export function Constellation() {
  const { concepts, threads, thinkers, lexicon, encounters, library } =
    useMasteryData();
  const hasMastered = concepts.some((c) => c.level === 'mastered');
  const [view, setView] = useState<ConstellationView>('overview');

  return (
    <Column>
      <div className={styles.container}>
        <Text
          variant="pageTitle"
          as="h1"
          style={{ marginBottom: 16 }}
        >
          Constellation
        </Text>
        <nav className={styles.subNav} aria-label="Constellation views">
          {viewTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setView(tab.id)}
              className={
                tab.id === view ? styles.subTabActive : styles.subTab
              }
              aria-current={tab.id === view ? 'page' : undefined}
            >
              {tab.label}
            </button>
          ))}
        </nav>
        <Rule margin={spacing.sectionGap} />
        {view === 'overview' && (
          <ConstellationOverview
            concepts={concepts}
            threads={threads}
            thinkers={thinkers}
            hasMastered={hasMastered}
          />
        )}
        {view === 'lexicon' && <ConstellationLexicon entries={lexicon} />}
        {view === 'encounters' && (
          <ConstellationEncounters encounters={encounters} />
        )}
        {view === 'library' && <ConstellationLibrary texts={library} />}
        <div className={styles.spacer} />
      </div>
    </Column>
  );
}

/** Extracted to keep file under 150 lines. */
function ConstellationOverview({
  concepts,
  threads,
  thinkers,
  hasMastered,
}: {
  concepts: ReturnType<typeof useMasteryData>['concepts'];
  threads: ReturnType<typeof useMasteryData>['threads'];
  thinkers: ReturnType<typeof useMasteryData>['thinkers'];
  hasMastered: boolean;
}) {
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
