/**
 * MarkdownContent — renders markdown text inline with @mention and /command
 * chip support. Parses @[name](type:id) as MentionChip and /command as
 * SlashChip. Supports bold, italic, code, links, lists, blockquotes.
 */
import ReactMarkdown from 'react-markdown';
import type { ReactNode } from 'react';
import { MentionChip, MENTION_PATTERN } from './MentionChip';
import { SlashChip } from './SlashChip';
import type { EntityType } from '@/hooks/useEntityIndex';
import styles from './MarkdownContent.module.css';

interface MarkdownContentProps {
  children: string;
  className?: string;
}

const ALLOWED = [
  'p', 'em', 'strong', 'code', 'a',
  'ul', 'ol', 'li', 'blockquote', 'br', 'del', 'sup', 'sub',
];

/** Pattern for /command tokens (at start or after whitespace). */
const SLASH_PATTERN = /(?:^|\s)(\/(?:draw|visualize|research|explain|summarize|quiz|timeline|connect|define|teach|podcast|flashcards|exercise))\b/;

export function MarkdownContent({ children, className }: MarkdownContentProps) {
  const hasMentions = MENTION_PATTERN.test(children);
  const hasSlash = SLASH_PATTERN.test(children);

  if (hasMentions || hasSlash) {
    return <ChipAwareContent text={children} className={className} />;
  }
  if (!hasMarkdown(children)) return <>{children}</>;
  return <MdSpan className={className}>{children}</MdSpan>;
}

/** Splits text on @mentions and /commands, renders chips inline. */
function ChipAwareContent({ text, className }: { text: string; className?: string }) {
  // Combined regex: @mentions OR /commands
  const mentionSrc = MENTION_PATTERN.source;
  const slashSrc = '(?:^|\\s)(\\/(?:draw|visualize|research|explain|summarize|quiz|timeline|connect|define|teach|podcast|flashcards|exercise))(?=\\s|[.,;:!?]|$)';
  const combined = new RegExp(`${mentionSrc}|${slashSrc}`, 'g');

  const parts: ReactNode[] = [];
  let lastIdx = 0;
  let match;

  while ((match = combined.exec(text)) !== null) {
    // Determine if it's a mention (@[name](type:id)) or slash (/command)
    if (match[1] != null) {
      // Mention match — groups 1,2,3
      if (match.index > lastIdx) pushText(parts, text.slice(lastIdx, match.index), className);
      parts.push(<MentionChip key={`m${match.index}`}
        name={match[1]} entityType={(match[2] ?? 'concept') as EntityType}
        entityId={match[3] ?? ''} />);
      lastIdx = match.index + match[0].length;
    } else if (match[4] != null) {
      // Slash match — group 4, may have leading whitespace
      const cmdStart = match[0].indexOf('/');
      const absStart = match.index + cmdStart;
      if (absStart > lastIdx) pushText(parts, text.slice(lastIdx, absStart), className);
      const cmd = match[4].startsWith('/') ? match[4].slice(1) : match[4];
      parts.push(<SlashChip key={`s${match.index}`} command={cmd} />);
      lastIdx = absStart + (match[4]?.length ?? 0);
    }
  }

  if (lastIdx < text.length) pushText(parts, text.slice(lastIdx), className);
  return <>{parts}</>;
}

function pushText(parts: ReactNode[], txt: string, cls?: string) {
  if (!txt) return;
  parts.push(hasMarkdown(txt)
    ? <MdSpan key={`t${parts.length}`} className={cls}>{txt}</MdSpan>
    : txt);
}

function MdSpan({ children, className }: { children: string; className?: string }) {
  return (
    <span className={`${styles.markdown} ${className ?? ''}`}>
      <ReactMarkdown allowedElements={ALLOWED} unwrapDisallowed components={{
        p: ({ children: c }: { children?: ReactNode }) => <>{c}</>,
        a: ({ href, children: c }: { href?: string; children?: ReactNode }) => (
          <a className={styles.link} href={href}
            target="_blank" rel="noopener noreferrer">{c}</a>),
        code: ({ children: c }: { children?: ReactNode }) => (
          <code className={styles.code}>{c}</code>),
        blockquote: ({ children: c }: { children?: ReactNode }) => (
          <blockquote className={styles.blockquote}>{c}</blockquote>),
      }}>{children}</ReactMarkdown>
    </span>
  );
}

function hasMarkdown(text: string): boolean {
  return /[*_`\[\]>#\-~]/.test(text);
}
