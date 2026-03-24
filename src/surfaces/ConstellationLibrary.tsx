/**
 * ConstellationLibrary — Library sub-section of the Constellation surface.
 * Displays primary texts the student is working through.
 * Drawn from prototype Screen 1 (Library).
 */
import { Text } from '@/primitives/Text';
import { spacing } from '@/tokens/spacing';
import { useEntityNavigation } from '@/hooks/useEntityNavigation';
import type { PrimaryText } from '@/types/lexicon';
import styles from './ConstellationLibrary.module.css';

function TextCard({ text }: { text: PrimaryText }) {
  const { navigateTo } = useEntityNavigation();

  const handleAnnotationClick = () => {
    if (text.annotationCount === 0) return;
    // Navigate to the notebook to see annotations in context
    navigateTo({
      target: { type: 'lexicon-term', term: text.title },
      surface: 'notebook',
      highlight: true,
    });
  };

  return (
    <div className={`${styles.card} ${text.isCurrent ? styles.current : ''}`}>
      {text.coverUrl && (
        <img className={styles.cover} src={text.coverUrl}
          alt={`Cover of ${text.title}`} loading="lazy" />
      )}
      {text.isCurrent && (
        <span className={styles.currentLabel}>Current Focus</span>
      )}
      <h3 className={styles.title}>{text.title}</h3>
      <span className={styles.author}>{text.author}</span>
      <p className={styles.quote}>{text.quote}</p>
      <button
        className={styles.annotations}
        onClick={handleAnnotationClick}
        disabled={text.annotationCount === 0}
        title={text.annotationCount > 0
          ? `View ${text.annotationCount} annotation${text.annotationCount !== 1 ? 's' : ''} in notebook`
          : 'No annotations yet'}
      >
        {text.annotationCount} annotation{text.annotationCount !== 1 ? 's' : ''}
      </button>
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
