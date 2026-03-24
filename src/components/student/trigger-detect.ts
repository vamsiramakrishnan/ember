/**
 * Trigger detection — finds @ mentions and / commands at cursor position.
 * Extracted from InputZone for 150-line discipline.
 */

export interface TriggerResult {
  type: 'mention' | 'slash' | null;
  query: string;
  /** Character position where the trigger token starts. */
  position: number;
}

const NO_TRIGGER: TriggerResult = { type: null, query: '', position: -1 };

/**
 * Detect @ or / trigger at the cursor position by scanning backward.
 * @ mentions allow spaces in names (e.g., @Jean-Baptiste Fourier).
 * The query continues until a delimiter: , ; . ! ? ( ) [ ] { } or newline.
 */
export function detectTrigger(text: string, cursorPos: number): TriggerResult {
  const before = text.slice(0, cursorPos);

  // @ mention — allow word chars, spaces, hyphens, apostrophes in the query.
  // Stops at punctuation delimiters or double-space (end of name).
  const atMatch = before.match(/@([\w][\w\s'\u2019-]*)$/);
  if (atMatch) {
    // Trim trailing whitespace from the query (user may have typed space after name)
    const rawQuery = atMatch[1] ?? '';
    const query = rawQuery.replace(/\s+$/, '');
    return {
      type: 'mention',
      query,
      position: cursorPos - atMatch[0].length,
    };
  }

  // Bare @ with no characters yet
  if (before.endsWith('@')) {
    return { type: 'mention', query: '', position: cursorPos - 1 };
  }

  // / must be at start of text or preceded by whitespace
  const slashMatch = before.match(/(?:^|\s)\/(\w*)$/);
  if (slashMatch) {
    const offset = slashMatch[0].startsWith('/') ? 0 : 1;
    return {
      type: 'slash',
      query: slashMatch[1] ?? '',
      position: cursorPos - slashMatch[0].length + offset,
    };
  }

  return NO_TRIGGER;
}

/**
 * Replace the trigger token at `position` with `insertText`.
 * Handles multi-word @ mentions (the token may contain spaces).
 */
export function replaceTrigger(
  text: string, position: number, insertText: string,
): string {
  const before = text.slice(0, position);
  const afterTrigger = text.slice(position);
  // Match the full trigger token: @ or / followed by word chars, spaces, hyphens
  const tokenEnd = afterTrigger.match(/^[@/][\w\s'\u2019-]*/);
  const skip = tokenEnd ? tokenEnd[0].replace(/\s+$/, '').length : 0;
  return before + insertText + text.slice(position + skip);
}
