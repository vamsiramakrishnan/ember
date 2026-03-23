/**
 * ConstellationLexicon — Lexicon sub-section of the Constellation surface.
 * Displays the student's personal vocabulary with mastery tracking.
 * Drawn from prototype Screen 3 (Lexicon).
 */
import { Text } from '@/primitives/Text';
import { Rule } from '@/primitives/Rule';
import { spacing } from '@/tokens/spacing';
import { colors } from '@/tokens/colors';
import { useEntityNavigation } from '@/hooks/useEntityNavigation';
import type { LexiconEntry } from '@/types/lexicon';
import type { MasteryLevel } from '@/types/mastery';
import styles from './ConstellationLexicon.module.css';

const levelColors: Record<MasteryLevel, string> = {
  mastered: colors.sage,
  strong: colors.ink,
  developing: colors.indigo,
  exploring: colors.inkGhost,
};

interface LexiconEntryRowProps {
  entry: LexiconEntry;
}

function LexiconEntryRow({ entry }: LexiconEntryRowProps) {
  const { navigateTo } = useEntityNavigation();

  const handleTermClick = () => {
    navigateTo({
      target: { type: 'lexicon-term', term: entry.term },
      surface: 'notebook',
      highlight: true,
    });
  };

  const handleCrossRefClick = (ref: string) => {
    // Navigate within lexicon — scroll to the referenced term
    const el = document.querySelector(`[data-term="${ref}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div className={styles.entry} data-term={entry.term}>
      <div className={styles.entryHeader}>
        <span className={styles.entryNumber}>
          {String(entry.number).padStart(3, '0')}
        </span>
        <button
          className={styles.term}
          onClick={handleTermClick}
          title={`See where "${entry.term}" first appeared in notebook`}
        >
          {entry.term}
        </button>
        <span className={styles.pronunciation}>{entry.pronunciation}</span>
      </div>
      <p className={styles.definition}>{entry.definition}</p>
      <div className={styles.meta}>
        <div className={styles.etymology}>
          <span className={styles.metaLabel}>Etymology</span>
          <p className={styles.etymologyText}>{entry.etymology}</p>
        </div>
        {entry.crossReferences.length > 0 && (
          <div className={styles.crossRefs}>
            <span className={styles.metaLabel}>Cross-references</span>
            <div className={styles.refList}>
              {entry.crossReferences.map((ref) => (
                <button
                  key={ref}
                  className={styles.refLink}
                  onClick={() => handleCrossRefClick(ref)}
                  title={`Jump to "${ref}"`}
                >
                  {ref}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className={styles.masteryRow}>
        <div className={styles.track}>
          <div
            className={styles.fill}
            style={{
              width: `${entry.percentage}%`,
              backgroundColor: levelColors[entry.level],
            }}
          />
        </div>
        <span className={styles.masteryLabel}>{entry.percentage}%</span>
      </div>
    </div>
  );
}

interface ConstellationLexiconProps {
  entries: LexiconEntry[];
}

export function ConstellationLexicon({ entries }: ConstellationLexiconProps) {
  return (
    <section aria-label="Lexicon">
      <Text
        variant="sectionLabel"
        as="h2"
        style={{
          marginBottom: spacing.labelToContent,
          textTransform: 'uppercase',
        }}
      >
        Lexicon
      </Text>
      <Text variant="bodySecondary" as="p" style={{ marginBottom: 24 }}>
        {entries.length} terms catalogued
      </Text>
      {entries.map((entry, i) => (
        <div key={entry.term}>
          <LexiconEntryRow entry={entry} />
          {i < entries.length - 1 && <Rule margin={20} />}
        </div>
      ))}
    </section>
  );
}
