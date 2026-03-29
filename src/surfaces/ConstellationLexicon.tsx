/**
 * ConstellationLexicon — Lexicon sub-section of the Constellation surface.
 *
 * Incremental reveal:
 *   Layer 0: term heading + short definition. Always visible.
 *   Layer 1: pronunciation + mastery bar. Visible at rest but quiet.
 *   Layer 3 (click): etymology, cross-references, full mastery detail.
 *
 * See: 06-component-inventory.md
 */
import { Text } from '@/primitives/Text';
import { Rule } from '@/primitives/Rule';
import { spacing } from '@/tokens/spacing';
import { LexiconEntryRow } from './LexiconEntryRow';
import type { LexiconEntry } from '@/types/lexicon';

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
        <div key={entry.term} style={{ animationDelay: `${i * 0.05}s` }}>
          <LexiconEntryRow entry={entry} index={i} />
          {i < entries.length - 1 && <Rule margin={20} />}
        </div>
      ))}
    </section>
  );
}
