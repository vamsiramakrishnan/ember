/**
 * MarkdownContent — renders markdown text inline with @mention support.
 * Supports: bold, italic, inline code, links, lists, blockquotes.
 * Parses @[name](type:id) mentions and renders MentionChip components.
 * Does NOT render headings (Ember has its own typographic hierarchy)
 * or images (no external resources). Inherits parent typography.
 */
import ReactMarkdown from 'react-markdown';
import type { ReactNode } from 'react';
import { MentionChip, MENTION_PATTERN } from './MentionChip';
import type { EntityType } from '@/hooks/useEntityIndex';
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
  const hasMentions = MENTION_PATTERN.test(children);

  if (hasMentions) {
    return <MentionAwareContent text={children} className={className} />;
  }

  if (!hasMarkdown(children)) return <>{children}</>;

  return <MarkdownSpan className={className}>{children}</MarkdownSpan>;
}

/** Splits text on @[name](type:id) patterns, renders chips inline. */
function MentionAwareContent({ text, className }: { text: string; className?: string }) {
  const parts: ReactNode[] = [];
  const regex = new RegExp(MENTION_PATTERN.source, 'g');
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      const before = text.slice(lastIndex, match.index);
      parts.push(hasMarkdown(before)
        ? <MarkdownSpan key={`t${lastIndex}`} className={className}>{before}</MarkdownSpan>
        : before);
    }
    parts.push(
      <MentionChip
        key={`m${match.index}`}
        name={match[1] ?? ''}
        entityType={(match[2] ?? 'concept') as EntityType}
        entityId={match[3] ?? ''}
      />,
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    const after = text.slice(lastIndex);
    parts.push(hasMarkdown(after)
      ? <MarkdownSpan key={`t${lastIndex}`} className={className}>{after}</MarkdownSpan>
      : after);
  }

  return <>{parts}</>;
}

function MarkdownSpan({ children, className }: { children: string; className?: string }) {
  return (
    <span className={`${styles.markdown} ${className ?? ''}`}>
      <ReactMarkdown
        allowedElements={ALLOWED_ELEMENTS}
        unwrapDisallowed
        components={{
          p: ({ children: c }: { children?: ReactNode }) => <>{c}</>,
          a: ({ href, children: c }: { href?: string; children?: ReactNode }) => (
            <a className={styles.link} href={href}
              target="_blank" rel="noopener noreferrer">{c}</a>
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
