/**
 * LexiconEntryRow — a single term in the Constellation Lexicon.
 * Incremental reveal: Layer 0 (always), Layer 1 (mastery bar),
 * Layer 3 (click to expand etymology + cross-refs).
 * See: 06-component-inventory.md
 */
import { useState, useRef, useCallback } from 'react';
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

interface Props { entry: LexiconEntry; index?: number }

export function LexiconEntryRow({ entry, index = 0 }: Props) {
  const { navigateTo } = useEntityNavigation();
  const [expanded, setExpanded] = useState(false);
  /* Dwell state: 400ms hover reveals etymology inline without full expansion.
   * was: absent (hover only changed background), now: 400ms dwell bloom
   * reason: the bloom interaction is part of the Lexicon's identity (audit P8) */
  const [dwelling, setDwelling] = useState(false);
  const dwellTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const handleMouseEnter = useCallback(() => {
    if (expanded || !entry.etymology) return;
    dwellTimerRef.current = setTimeout(() => setDwelling(true), 400);
  }, [expanded, entry.etymology]);

  const handleMouseLeave = useCallback(() => {
    if (dwellTimerRef.current) clearTimeout(dwellTimerRef.current);
    setDwelling(false);
  }, []);

  const handleTermClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigateTo({ target: { type: 'lexicon-term', term: entry.term }, surface: 'notebook', highlight: true });
  };

  const handleCrossRefClick = (ref: string) => {
    const el = document.querySelector(`[data-term="${ref}"]`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const hasDetail = entry.etymology || entry.crossReferences.length > 0;

  return (
    <div
      className={`${styles.entry} ${expanded ? styles.entryExpanded : ''}`}
      style={{ animationDelay: `${index * 0.05}s` }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      data-term={entry.term}
      onClick={() => hasDetail && setExpanded(!expanded)}
      role={hasDetail ? 'button' : undefined}
      tabIndex={hasDetail ? 0 : undefined}
      onKeyDown={hasDetail ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpanded(!expanded); }
      } : undefined}
      aria-expanded={hasDetail ? expanded : undefined}
    >
      <div className={styles.entryHeader}>
        <span className={styles.entryNumber}>{String(entry.number).padStart(3, '0')}</span>
        <button className={styles.term} onClick={handleTermClick} title={`See where "${entry.term}" first appeared`}>
          {entry.term}
        </button>
        <span className={styles.pronunciation}>{entry.pronunciation}</span>
        {hasDetail && <span className={styles.expandHint} aria-hidden="true">{expanded ? '−' : '+'}</span>}
      </div>
      <p className={styles.definition}>{entry.definition}</p>

      <div className={styles.masteryRow}>
        <div className={styles.track}>
          <div className={styles.fill} style={{ width: `${entry.percentage}%`, backgroundColor: levelColors[entry.level] }} />
        </div>
        <span className={styles.masteryLabel}>{entry.percentage}%</span>
      </div>

      {/* Dwell bloom: lightweight etymology preview on 400ms hover */}
      {dwelling && !expanded && entry.etymology && (
        <div className={styles.dwellBloom}>
          <span className={styles.metaLabel}>Etymology</span>
          <p className={styles.dwellEtymology}>{entry.etymology}</p>
        </div>
      )}

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
                    key={ref} className={styles.refLink}
                    onClick={(e) => { e.stopPropagation(); handleCrossRefClick(ref); }}
                    title={`Jump to "${ref}"`}
                  >{ref}</button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
