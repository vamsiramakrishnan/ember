/**
 * MarkdownContent — unified markdown rendering pipeline for Ember.
 *
 * Single pipeline: remarkGfm (tables) → remarkMath (LaTeX) →
 * rehypeKatex (render math) → rehypeChips (@mentions, /commands).
 * Code blocks highlighted via Shiki (lazy-loaded).
 *
 * Two modes:
 *   block (default) — renders as <div>, supports tables, code, math blocks
 *   inline — renders as <span>, strips block elements, safe inside <p>
 */
import { useMemo, type ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { rehypeChips } from './rehypeChips';
import { MentionChip } from './MentionChip';
import { SlashChip } from './SlashChip';
import { CodeBlock } from './CodeBlock';
import type { EntityType } from '@/hooks/useEntityIndex';
import styles from './MarkdownContent.module.css';

interface Props {
  children: string;
  className?: string;
  /** 'block' (default) renders tables/code/math. 'inline' is safe inside <p>. */
  mode?: 'block' | 'inline';
}

type Comp = React.ComponentType<Record<string, unknown>>;

const REMARK = [remarkGfm, remarkMath];
const REHYPE = [rehypeKatex, rehypeChips];

/* ── Shared component renderers ──────────────────────────────── */

const chipRenderers: Record<string, Comp> = {
  'mention-chip': (p: Record<string, unknown>) => (
    <MentionChip
      name={String(p.name ?? '')}
      entityType={String(p.entityType ?? 'concept') as EntityType}
      entityId={String(p.entityId ?? '')}
    />
  ),
  'slash-chip': (p: Record<string, unknown>) => (
    <SlashChip command={String(p.command ?? '')} />
  ),
};

const linkRenderer: Comp = ({ href, children: c }) => (
  <a className={styles.link} href={href as string}
    target="_blank" rel="noopener noreferrer">{c as ReactNode}</a>
);

const quoteRenderer: Comp = ({ children: c }) => (
  <blockquote className={styles.blockquote}>{c as ReactNode}</blockquote>
);

const inlineCodeRenderer: Comp = ({ children: c }) => (
  <code className={styles.inlineCode}>{c as ReactNode}</code>
);

/* ── Mode-specific component maps ────────────────────────────── */

const BLOCK: Record<string, Comp> = {
  ...chipRenderers,
  a: linkRenderer,
  blockquote: quoteRenderer,
  pre: ({ children }) => <>{children as ReactNode}</>,
  code: ({ className, children }) => {
    const lang = /language-(\w+)/.exec(String(className ?? ''))?.[1];
    if (lang && typeof children === 'string') {
      return <CodeBlock language={lang}>{children}</CodeBlock>;
    }
    return <code className={styles.inlineCode}>{children as ReactNode}</code>;
  },
  table: ({ children: c }) => (
    <div className={styles.tableWrap}>
      <table className={styles.table}>{c as ReactNode}</table>
    </div>
  ),
  th: ({ children: c }) => <th className={styles.th}>{c as ReactNode}</th>,
  td: ({ children: c }) => <td className={styles.td}>{c as ReactNode}</td>,
};

const INLINE: Record<string, Comp> = {
  ...chipRenderers,
  p: ({ children: c }) => <>{c as ReactNode}</>,
  a: linkRenderer,
  blockquote: quoteRenderer,
  code: inlineCodeRenderer,
};

/* ── Main component ──────────────────────────────────────────── */

export function MarkdownContent({ children, className, mode = 'block' }: Props) {
  const isBlock = mode === 'block';
  const components = isBlock ? BLOCK : INLINE;

  const content = useMemo(
    () => (
      <ReactMarkdown
        remarkPlugins={REMARK}
        rehypePlugins={REHYPE}
        skipHtml
        components={components}
      >
        {children}
      </ReactMarkdown>
    ),
    [children, components],
  );

  const Tag = isBlock ? 'div' : 'span';
  return <Tag className={`${styles.markdown} ${className ?? ''}`}>{content}</Tag>;
}
