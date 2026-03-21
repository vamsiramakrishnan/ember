/**
 * ConstellationLexicon — Lexicon sub-section of the Constellation surface.
 * Displays the student's personal vocabulary with mastery tracking.
 * Drawn from prototype Screen 3 (Lexicon).
 */
import { Text } from '@/primitives/Text';
import { Rule } from '@/primitives/Rule';
import { spacing } from '@/tokens/spacing';
import type { LexiconEntry } from '@/types/lexicon';
import styles from './ConstellationLexicon.module.css';

interface LexiconEntryRowProps {
  entry: LexiconEntry;
}

function LexiconEntryRow({ entry }: LexiconEntryRowProps) {
  return (
    <div className={styles.entry}>
      <div className={styles.entryHeader}>
        <span className={styles.entryNumber}>
          {String(entry.number).padStart(3, '0')}
        </span>
        <h3 className={styles.term}>{entry.term}</h3>
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
                <span key={ref} className={styles.refLink}>{ref}</span>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className={styles.masteryRow}>
        <div className={styles.track}>
          <div
            className={styles.fill}
            style={{ width: `${entry.percentage}%` }}
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
