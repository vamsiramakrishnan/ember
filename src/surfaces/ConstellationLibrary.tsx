/**
 * ConstellationLibrary — Library sub-section of the Constellation surface.
 * Displays primary texts the student is working through.
 * Drawn from prototype Screen 1 (Library).
 */
import { Text } from '@/primitives/Text';
import { spacing } from '@/tokens/spacing';
import type { PrimaryText } from '@/types/lexicon';
import styles from './ConstellationLibrary.module.css';

function TextCard({ text }: { text: PrimaryText }) {
  return (
    <div className={`${styles.card} ${text.isCurrent ? styles.current : ''}`}>
      {text.isCurrent && (
        <span className={styles.currentLabel}>Current Focus</span>
      )}
      <h3 className={styles.title}>{text.title}</h3>
      <span className={styles.author}>{text.author}</span>
      <p className={styles.quote}>{text.quote}</p>
      <span className={styles.annotations}>
        {text.annotationCount} annotation{text.annotationCount !== 1 ? 's' : ''}
      </span>
    </div>
  );
}

interface ConstellationLibraryProps {
  texts: PrimaryText[];
}

export function ConstellationLibrary({ texts }: ConstellationLibraryProps) {
  return (
    <section aria-label="Library">
      <Text
        variant="sectionLabel"
        as="h2"
        style={{
          marginBottom: spacing.labelToContent,
          textTransform: 'uppercase',
        }}
      >
        Library
      </Text>
      <div className={styles.grid}>
        {texts.map((text) => (
          <TextCard key={text.title} text={text} />
        ))}
      </div>
    </section>
  );
}
