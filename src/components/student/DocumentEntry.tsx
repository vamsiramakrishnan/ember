/**
 * DocumentEntry — renders an uploaded document (PDF, DOCX, etc).
 * PDFs get an inline iframe preview. Other docs show metadata + extract.
 */
import { MarkdownContent } from '@/primitives/MarkdownContent';
import { getBlobAsDataUrl } from '@/persistence/repositories/blobs';
import { useState, useEffect } from 'react';
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

const isPdf = (name: string) => name.toLowerCase().endsWith('.pdf');

export function DocumentEntry({ file, pages, extractedText }: DocumentEntryProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  // For PDFs, resolve the blob to a data URL for iframe preview
  useEffect(() => {
    if (!isPdf(file.name) || !file.blobHash) return;
    getBlobAsDataUrl(file.blobHash).then((url) => {
      if (url) setBlobUrl(url);
    });
  }, [file.blobHash, file.name]);

  return (
    <div className={styles.container}>
      {/* PDF preview */}
      {isPdf(file.name) && blobUrl && (
        <iframe
          className={styles.pdfPreview}
          src={blobUrl}
          title={file.name}
        />
      )}

      {/* File card */}
      <div className={styles.docCard}>
        <div className={styles.icon}>{isPdf(file.name) ? '▤' : '◻'}</div>
        <div className={styles.info}>
          <span className={styles.name}>{file.name}</span>
          <span className={styles.meta}>
            {formatSize(file.size)}
            {pages ? ` · ${pages} pages` : ''}
          </span>
        </div>
      </div>

      {/* Extracted text */}
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
