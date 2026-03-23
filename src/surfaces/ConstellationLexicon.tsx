/**
 * ConstellationLexicon — Lexicon sub-section of the Constellation surface.
 *
 * Incremental reveal:
 *   Layer 0: term heading + short definition. Always visible.
 *   Layer 1: pronunciation + mastery bar. Visible at rest but quiet.
 *   Layer 3 (click): etymology, cross-references, full mastery detail.
 *     Click the entry row to expand. Click again to collapse.
 *
 * See: 06-component-inventory.md
 */
import { useState } from 'react';
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

function LexiconEntryRow({ entry }: { entry: LexiconEntry }) {
  const { navigateTo } = useEntityNavigation();
  const [expanded, setExpanded] = useState(false);

  const handleTermClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigateTo({
      target: { type: 'lexicon-term', term: entry.term },
      surface: 'notebook',
      highlight: true,
    });
  };

  const handleCrossRefClick = (ref: string) => {
    const el = document.querySelector(`[data-term="${ref}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const hasDetail = entry.etymology || entry.crossReferences.length > 0;

  return (
    <div
      className={`${styles.entry} ${expanded ? styles.entryExpanded : ''}`}
      data-term={entry.term}
      onClick={() => hasDetail && setExpanded(!expanded)}
      role={hasDetail ? 'button' : undefined}
      tabIndex={hasDetail ? 0 : undefined}
      onKeyDown={hasDetail ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setExpanded(!expanded);
        }
      } : undefined}
      aria-expanded={hasDetail ? expanded : undefined}
    >
      {/* Layer 0: always visible */}
      <div className={styles.entryHeader}>
        <span className={styles.entryNumber}>
          {String(entry.number).padStart(3, '0')}
        </span>
        <button
          className={styles.term}
          onClick={handleTermClick}
          title={`See where "${entry.term}" first appeared`}
        >
          {entry.term}
        </button>
        <span className={styles.pronunciation}>{entry.pronunciation}</span>
        {hasDetail && (
          <span className={styles.expandHint} aria-hidden="true">
            {expanded ? '−' : '+'}
          </span>
        )}
      </div>
      <p className={styles.definition}>{entry.definition}</p>

      {/* Layer 1: mastery bar — always visible but quiet */}
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

      {/* Layer 3: expanded detail — etymology + cross-refs */}
      {expanded && (
        <div className={styles.detail}>
          {entry.etymology && (
            <div className={styles.etymology}>
              <span className={styles.metaLabel}>Etymology</span>
              <p className={styles.etymologyText}>{entry.etymology}</p>
            </div>
          )}
          {entry.crossReferences.length > 0 && (
            <div className={styles.crossRefs}>
              <span className={styles.metaLabel}>Cross-references</span>
              <div className={styles.refList}>
                {entry.crossReferences.map((ref) => (
                  <button
                    key={ref}
                    className={styles.refLink}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCrossRefClick(ref);
                    }}
                    title={`Jump to "${ref}"`}
                  >
                    {ref}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
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
