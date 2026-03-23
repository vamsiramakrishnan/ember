/**
 * Patch Applier — layered matching for HTML artifacts (inspired by aider).
 * 1. Exact string match  2. Whitespace-normalized  3. DOM-selector match
 */

export interface Patch {
  search: string;
  replace: string;
  /** Optional CSS selector for DOM-aware matching. */
  selector?: string;
}

/** A record of what changed and why. */
export interface RefinementStep {
  iteration: number;
  patchCount: number;
  issues: string[];
  score: number;
}

/** Apply a list of patches with layered fallback matching. */
export function applyPatches(html: string, patches: Patch[]): string {
  let result = html;
  for (const patch of patches) {
    result = applyOne(result, patch);
  }
  return result;
}

function applyOne(html: string, patch: Patch): string {
  // Strategy 1: Exact string match
  if (patch.search && html.includes(patch.search)) {
    return html.replace(patch.search, patch.replace);
  }

  // Strategy 2: Whitespace-normalized match
  if (patch.search) {
    const normalizedSearch = normalizeWhitespace(patch.search);
    const normalizedHtml = normalizeWhitespace(html);
    const idx = normalizedHtml.indexOf(normalizedSearch);
    if (idx !== -1) {
      // Find the original boundaries in the un-normalized HTML
      const originalSlice = findOriginalSlice(html, patch.search);
      if (originalSlice) {
        return html.slice(0, originalSlice.start) + patch.replace + html.slice(originalSlice.end);
      }
    }
  }

  // Strategy 3: DOM-selector match (for selector-based patches)
  if (patch.selector) {
    return applySelectorPatch(html, patch.selector, patch.replace);
  }

  // No match found — return unchanged
  return html;
}

/** Collapse runs of whitespace to single spaces. */
function normalizeWhitespace(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
}

/** Find the original slice boundaries by matching normalized content. */
function findOriginalSlice(
  html: string, search: string,
): { start: number; end: number } | null {
  const searchNorm = normalizeWhitespace(search);
  const searchLen = searchNorm.length;
  let htmlPos = 0;
  let normPos = 0;
  let matchStart = -1;

  while (htmlPos < html.length) {
    const ch = html[htmlPos];
    const isSpace = /\s/.test(ch ?? '');

    // Skip runs of whitespace in the original HTML
    if (isSpace) {
      // Advance past all whitespace
      while (htmlPos < html.length && /\s/.test(html[htmlPos] ?? '')) htmlPos++;
      // In normalized form, this is a single space
      if (normPos < searchLen && searchNorm[normPos] === ' ') {
        if (matchStart === -1) { matchStart = htmlPos - 1; }
        normPos++;
      } else {
        matchStart = -1;
        normPos = 0;
      }
      continue;
    }

    if (searchNorm[normPos] === ch) {
      if (matchStart === -1) matchStart = htmlPos;
      normPos++;
      if (normPos === searchLen) {
        return { start: matchStart, end: htmlPos + 1 };
      }
    } else {
      matchStart = -1;
      normPos = 0;
    }
    htmlPos++;
  }

  return null;
}

/** Replace content within elements matching a CSS selector. */
function applySelectorPatch(
  html: string, selector: string, replacement: string,
): string {
  // Simple selector matching for common patterns:
  // .class-name, #id, element.class, [data-attr="value"]
  const pattern = selectorToRegex(selector);
  if (!pattern) return html;

  return html.replace(pattern, (match) => {
    // Find the inner content and replace it
    const tagEnd = match.indexOf('>');
    if (tagEnd === -1) return match;
    const openTag = match.slice(0, tagEnd + 1);
    const closeIdx = match.lastIndexOf('</');
    if (closeIdx === -1) return match;
    const closeTag = match.slice(closeIdx);
    return openTag + replacement + closeTag;
  });
}

/** Convert a simple CSS selector to a regex for matching HTML elements. */
function selectorToRegex(selector: string): RegExp | null {
  if (selector.startsWith('.')) {
    const cls = escapeRegex(selector.slice(1));
    return new RegExp(`<[^>]*class="[^"]*\\b${cls}\\b[^"]*"[^>]*>[\\s\\S]*?<\\/[^>]+>`, 'i');
  }
  if (selector.startsWith('#')) {
    const id = escapeRegex(selector.slice(1));
    return new RegExp(`<[^>]*id="${id}"[^>]*>[\\s\\S]*?<\\/[^>]+>`, 'i');
  }
  return null;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
