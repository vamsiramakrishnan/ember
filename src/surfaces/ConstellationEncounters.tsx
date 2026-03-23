/**
 * ConstellationEncounters — Encounter log sub-section of Constellation.
 * Displays a ledger of intellectual encounters with thinkers.
 * Drawn from prototype Screen 4 (Archive Ledger).
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

function EncounterRow({ encounter }: { encounter: Encounter }) {
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
    <div className={styles.row}>
      <span className={styles.ref}>{encounter.ref}</span>
      <div className={styles.thinkerCol}>
        <button
          className={styles.thinkerName}
          onClick={handleThinkerClick}
          title={`Navigate to ${encounter.thinker} in notebook`}
        >
          {encounter.thinker}
        </button>
        <span className={styles.tradition}>{encounter.tradition}</span>
      </div>
      <p className={styles.coreIdea}>{encounter.coreIdea}</p>
      <div className={styles.sessionCol}>
        <span className={styles.sessionTopic}>{encounter.sessionTopic}</span>
        <span className={styles.date}>{encounter.date}</span>
      </div>
      <span className={`${styles.status} ${styles[encounter.status]}`}>
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
      {encounters.map((encounter) => (
        <EncounterRow key={encounter.ref} encounter={encounter} />
      ))}
    </section>
  );
}
