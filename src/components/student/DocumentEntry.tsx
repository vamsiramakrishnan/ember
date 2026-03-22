/**
 * DocumentEntry — renders an uploaded document (PDF, DOCX, etc).
 * Shows file metadata, page count, and extracted text summary.
 * The document has been processed by the Reader agent and
 * indexed into File Search for the tutor to reference.
 */
import { MarkdownContent } from '@/primitives/MarkdownContent';
import type { FileAttachment } from '@/types/entries';
import styles from './DocumentEntry.module.css';

interface DocumentEntryProps {
  file: FileAttachment;
  pages?: number;
  extractedText?: string;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentEntry({ file, pages, extractedText }: DocumentEntryProps) {
  return (
    <div className={styles.container}>
      <div className={styles.docCard}>
        <div className={styles.icon}>▤</div>
        <div className={styles.info}>
          <span className={styles.name}>{file.name}</span>
          <span className={styles.meta}>
            {formatSize(file.size)}
            {pages ? ` · ${pages} pages` : ''}
          </span>
        </div>
      </div>
      {extractedText && (
        <div className={styles.extract}>
          <div className={styles.extractLabel}>extracted content</div>
          <div className={styles.extractText}>
            <MarkdownContent>{extractedText}</MarkdownContent>
          </div>
        </div>
      )}
    </div>
  );
}
