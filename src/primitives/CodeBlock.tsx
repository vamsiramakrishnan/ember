/**
 * CodeBlock — Shiki-powered syntax-highlighted code block.
 * Lazy-loads the highlighter singleton; renders plain code as fallback
 * until Shiki is ready. Uses github-light theme with Ember CSS overrides
 * for background warmth.
 */
import { useState, useEffect, memo } from 'react';
import styles from './MarkdownContent.module.css';

/* Use Shiki's own types via Awaited<ReturnType<createHighlighter>> */
type Highlighter = Awaited<ReturnType<typeof import('shiki')['createHighlighter']>>;

let instance: Highlighter | null = null;
let loading: Promise<Highlighter> | null = null;

const PRELOADED = ['python', 'javascript', 'typescript', 'json', 'html', 'css'] as const;

function getHighlighter(): Promise<Highlighter> {
  if (instance) return Promise.resolve(instance);
  if (!loading) {
    loading = import('shiki')
      .then(({ createHighlighter }) =>
        createHighlighter({
          themes: ['github-light'],
          langs: [...PRELOADED],
        }),
      )
      .then((h) => { instance = h; return h; });
  }
  return loading!;
}

interface CodeBlockProps {
  language: string;
  children: string;
}

export const CodeBlock = memo(function CodeBlock({ language, children }: CodeBlockProps) {
  const [html, setHtml] = useState<string | null>(null);
  const code = children.replace(/\n$/, '');

  useEffect(() => {
    let cancelled = false;
    getHighlighter()
      .then(async (h) => {
        let lang = language;
        if (!h.getLoadedLanguages().includes(lang)) {
          try { await h.loadLanguage(lang as never); } catch { lang = 'text'; }
        }
        if (!h.getLoadedLanguages().includes(lang)) lang = 'text';
        return h.codeToHtml(code, { lang, theme: 'github-light' });
      })
      .then((result) => { if (!cancelled) setHtml(result); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [code, language]);

  if (!html) {
    return (
      <pre className={styles.pre}>
        <code className={styles.codeFallback}>{code}</code>
      </pre>
    );
  }

  return <div className={styles.codeBlock} dangerouslySetInnerHTML={{ __html: html }} />;
});
