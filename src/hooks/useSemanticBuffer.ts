/**
 * useSemanticBuffer — masks incomplete block elements during streaming.
 *
 * While the AI streams, code fences, display math ($$), and tables
 * look ugly in half-rendered form. This hook detects unclosed blocks,
 * hides them, and reports what's being composed so the UI can show
 * a warm placeholder instead of raw partial markup.
 *
 * When streaming is done, everything passes through unmasked.
 */
import { useMemo } from 'react';

export type PendingBlock = 'code' | 'math' | 'table' | null;

interface BufferResult {
  /** The portion of text safe to render through MarkdownContent. */
  visible: string;
  /** What block type is being composed (null if nothing pending). */
  pending: PendingBlock;
}

export function useSemanticBuffer(raw: string, done: boolean): BufferResult {
  return useMemo(() => {
    if (done || !raw) return { visible: raw, pending: null };
    return splitAtIncomplete(raw);
  }, [raw, done]);
}

const PLACEHOLDER: Record<Exclude<PendingBlock, null>, string> = {
  code: 'composing code…',
  math: 'composing equation…',
  table: 'composing table…',
};

export function pendingLabel(pending: PendingBlock): string | null {
  return pending ? PLACEHOLDER[pending] : null;
}

/* ── Detection heuristics ──────────────────────────────────────
 * Simple and fast — not a full parser. Handles the 95% case:
 * odd count of ``` fences → unclosed code block
 * odd count of $$ markers → unclosed display math
 * trailing incomplete table row → unclosed table
 */

function splitAtIncomplete(text: string): BufferResult {
  // 1. Unclosed fenced code block (``` at line start, odd count)
  const fences = text.match(/^```/gm);
  if (fences && fences.length % 2 !== 0) {
    const idx = text.lastIndexOf('\n```');
    const cut = idx >= 0 ? idx : text.lastIndexOf('```');
    if (cut > 0) return { visible: text.slice(0, cut).trimEnd(), pending: 'code' };
  }

  // 2. Unclosed display math ($$ at line start, odd count)
  const maths = text.match(/^\$\$/gm);
  if (maths && maths.length % 2 !== 0) {
    const idx = text.lastIndexOf('\n$$');
    const cut = idx >= 0 ? idx : text.lastIndexOf('$$');
    if (cut > 0) return { visible: text.slice(0, cut).trimEnd(), pending: 'math' };
  }

  // 3. Table in progress — last line starts with | but row is incomplete
  const lines = text.split('\n');
  const lastLine = (lines[lines.length - 1] ?? '').trimStart();
  if (lastLine.startsWith('|') && !lastLine.trimEnd().endsWith('|')) {
    // Walk back to find table start
    let start = lines.length - 1;
    while (start > 0 && (lines[start - 1]?.trimStart().startsWith('|') ?? false)) start--;
    const pre = lines.slice(0, start).join('\n').trimEnd();
    if (pre) return { visible: pre, pending: 'table' };
  }

  return { visible: text, pending: null };
}
