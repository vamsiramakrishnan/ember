/**
 * EmbedEntry — renders a URL embed with title, description, and favicon.
 * Like a Notion bookmark block — quiet, informative, clickable.
 * No iframe — just metadata. The tutor can annotate it.
 */
import styles from './EmbedEntry.module.css';

interface EmbedEntryProps {
  url: string;
  title?: string;
  description?: string;
  favicon?: string;
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return url;
  }
}

export function EmbedEntry({ url, title, description, favicon }: EmbedEntryProps) {
  return (
    <a
      className={styles.embed}
      href={url}
      target="_blank"
      rel="noopener noreferrer"
    >
      {favicon && (
        <img
          className={styles.favicon}
          src={favicon}
          alt=""
          width={16}
          height={16}
        />
      )}
      <div className={styles.content}>
        <span className={styles.title}>{title ?? getDomain(url)}</span>
        {description && (
          <span className={styles.description}>{description}</span>
        )}
        <span className={styles.domain}>{getDomain(url)}</span>
      </div>
    </a>
  );
}
