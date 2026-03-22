/**
 * Citation — displays Google Search grounding sources.
 * Quiet, peripheral, trustworthy. Like footnotes in a well-set book.
 */
import styles from './Citation.module.css';

interface CitationProps {
  sources: Array<{ title: string; url: string }>;
}

function getDomain(url: string): string {
  try { return new URL(url).hostname.replace('www.', ''); }
  catch { return url; }
}

export function Citation({ sources }: CitationProps) {
  if (sources.length === 0) return null;

  return (
    <div className={styles.container}>
      <span className={styles.label}>sources</span>
      <div className={styles.sources}>
        {sources.map((s, i) => (
          <a
            key={i}
            className={styles.source}
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className={styles.domain}>{getDomain(s.url)}</span>
            {s.title && <span className={styles.title}>{s.title}</span>}
          </a>
        ))}
      </div>
    </div>
  );
}
