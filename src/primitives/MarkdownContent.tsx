/**
 * MarkdownContent — renders markdown text inline.
 * Supports: bold, italic, inline code, links, lists, blockquotes.
 * Does NOT render headings (Ember has its own typographic hierarchy)
 * or images (no external resources). Inherits parent typography.
 */
import ReactMarkdown from 'react-markdown';
import type { ReactNode } from 'react';
import styles from './MarkdownContent.module.css';

interface MarkdownContentProps {
  children: string;
  className?: string;
}

const ALLOWED_ELEMENTS = [
  'p', 'em', 'strong', 'code', 'a',
  'ul', 'ol', 'li', 'blockquote', 'br',
  'del', 'sup', 'sub',
];

export function MarkdownContent({ children, className }: MarkdownContentProps) {
  // Short-circuit for plain text (no markdown characters)
  if (!hasMarkdown(children)) {
    return <>{children}</>;
  }

  return (
    <span className={`${styles.markdown} ${className ?? ''}`}>
      <ReactMarkdown
        allowedElements={ALLOWED_ELEMENTS}
        unwrapDisallowed
        components={{
          p: ({ children: c }: { children?: ReactNode }) => <>{c}</>,
          a: ({ href, children: c }: { href?: string; children?: ReactNode }) => (
            <a
              className={styles.link}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
            >
              {c}
            </a>
          ),
          code: ({ children: c }: { children?: ReactNode }) => (
            <code className={styles.code}>{c}</code>
          ),
          blockquote: ({ children: c }: { children?: ReactNode }) => (
            <blockquote className={styles.blockquote}>{c}</blockquote>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </span>
  );
}

/** Quick check for markdown-like characters to avoid unnecessary parsing. */
function hasMarkdown(text: string): boolean {
  return /[*_`\[\]>#\-~]/.test(text);
}
