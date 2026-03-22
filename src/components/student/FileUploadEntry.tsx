/**
 * FileUploadEntry — renders an uploaded file inline.
 * Shows file name, type, size. If the AI has summarized it,
 * shows the summary. Quiet presentation — no download chrome.
 */
import { MarkdownContent } from '@/primitives/MarkdownContent';
import type { FileAttachment } from '@/types/entries';
import styles from './FileUploadEntry.module.css';

interface FileUploadEntryProps {
  file: FileAttachment;
  summary?: string;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileIcon(mimeType: string): string {
  if (mimeType.startsWith('image/')) return '◻';
  if (mimeType.includes('pdf')) return '▤';
  if (mimeType.includes('text/')) return '≡';
  if (mimeType.includes('json') || mimeType.includes('javascript')) return '{ }';
  return '◇';
}

export function FileUploadEntry({ file, summary }: FileUploadEntryProps) {
  return (
    <div className={styles.container}>
      <div className={styles.fileRow}>
        <span className={styles.icon}>{fileIcon(file.mimeType)}</span>
        <div className={styles.meta}>
          <span className={styles.name}>{file.name}</span>
          <span className={styles.size}>{formatSize(file.size)}</span>
        </div>
      </div>
      {summary && (
        <div className={styles.summary}>
          <MarkdownContent>{summary}</MarkdownContent>
        </div>
      )}
    </div>
  );
}
