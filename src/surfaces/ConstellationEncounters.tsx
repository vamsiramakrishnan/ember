/**
 * ConstellationEncounters — Encounter log sub-section of Constellation.
 *
 * Incremental reveal:
 *   Layer 0: thinker name + core idea (always visible)
 *   Layer 2 (hover): ref, session topic, date, status fade in
 *
 * The ledger feels clean at rest — just names and ideas.
 * Hover to see the full archival detail.
 */
import { Text } from '@/primitives/Text';
import { spacing } from '@/tokens/spacing';
import { useEntityNavigation } from '@/hooks/useEntityNavigation';
import type { Encounter } from '@/types/lexicon';
import styles from './ConstellationEncounters.module.css';

const statusLabels: Record<Encounter['status'], string> = {
  active: 'Active',
  dormant: 'Dormant',
  bridged: 'Bridged',
  pending: 'Pending',
};

function EncounterRow({ encounter, index = 0 }: { encounter: Encounter; index?: number }) {
  const { navigateTo } = useEntityNavigation();
  const statusText = encounter.status === 'bridged' && encounter.bridgedTo
    ? `Bridged to ${encounter.bridgedTo}`
    : statusLabels[encounter.status];

  const handleThinkerClick = () => {
    navigateTo({
      target: { type: 'thinker', thinkerName: encounter.thinker },
      surface: 'notebook',
      highlight: true,
    });
  };

  return (
    <div className={styles.row} style={{ animationDelay: `${index * 0.04}s` }}>
      {/* Layer 2: ref — visible on hover */}
      <span className={styles.ref}>{encounter.ref}</span>

      {/* Layer 0: always visible */}
      <div className={styles.thinkerCol}>
        {encounter.portraitUrl && (
          <img className={styles.portrait} src={encounter.portraitUrl}
            alt={encounter.thinker} loading="lazy" />
        )}
        <div>
          <button
            className={styles.thinkerName}
            onClick={handleThinkerClick}
            title={`Navigate to ${encounter.thinker} in notebook`}
          >
            {encounter.thinker}
          </button>
          <span className={styles.tradition}>{encounter.tradition}</span>
        </div>
      </div>
      <p className={styles.coreIdea}>{encounter.coreIdea}</p>

      {/* Layer 2: session detail — visible on hover */}
      <div className={`${styles.sessionCol} ${styles.hoverDetail}`}>
        <span className={styles.sessionTopic}>{encounter.sessionTopic}</span>
        <span className={styles.date}>{encounter.date}</span>
      </div>
      <span className={`${styles.status} ${styles[encounter.status]} ${styles.hoverDetail}`}>
        {statusText}
      </span>
    </div>
  );
}

interface ConstellationEncountersProps {
  encounters: Encounter[];
}

export function ConstellationEncounters({
  encounters,
}: ConstellationEncountersProps) {
  return (
    <section aria-label="Encounters">
      <Text
        variant="sectionLabel"
        as="h2"
        style={{
          marginBottom: spacing.labelToContent,
          textTransform: 'uppercase',
        }}
      >
        Encounters
      </Text>
      <div className={styles.header}>
        <span className={styles.headerCell}>Ref</span>
        <span className={styles.headerCell}>Thinker</span>
        <span className={styles.headerCellWide}>Core Idea</span>
        <span className={styles.headerCell}>Session</span>
        <span className={styles.headerCell}>Status</span>
      </div>
      {encounters.map((encounter, i) => (
        <EncounterRow key={encounter.ref} encounter={encounter} index={i} />
      ))}
    </section>
  );
}
