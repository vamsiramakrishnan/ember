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
 * Works anywhere in the text, not just at the end.
 */
export function detectTrigger(text: string, cursorPos: number): TriggerResult {
  const before = text.slice(0, cursorPos);

  const atMatch = before.match(/@(\w*)$/);
  if (atMatch) {
    return {
      type: 'mention',
      query: atMatch[1] ?? '',
      position: cursorPos - atMatch[0].length,
    };
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
 * Returns the new text value.
 */
export function replaceTrigger(
  text: string, position: number, insertText: string,
): string {
  const before = text.slice(0, position);
  const afterTrigger = text.slice(position);
  const tokenEnd = afterTrigger.match(/^[@/]\w*/);
  const skip = tokenEnd ? tokenEnd[0].length : 0;
  return before + insertText + text.slice(position + skip);
}
