/**
 * Tests for context-conversation.ts — builds conversation messages from entries.
 */
import { describe, it, expect } from 'vitest';
import { buildConversationMessages } from '../context-conversation';
import type { LiveEntry } from '@/types/entries';

function makeLive(type: string, content: string, id = 'e1'): LiveEntry {
  return {
    id,
    entry: { type, content } as LiveEntry['entry'],
    crossedOut: false,
    bookmarked: false,
    pinned: false,
    timestamp: Date.now(),
  };
}

describe('buildConversationMessages', () => {
  it('appends latest text as final user message', () => {
    const messages = buildConversationMessages([], 'Hello tutor');
    expect(messages).toHaveLength(1);
    expect(messages[0]!.role).toBe('user');
    expect(messages[0]!.parts[0]!.text).toBe('Hello tutor');
  });

  it('prepends context prefix to latest text', () => {
    const messages = buildConversationMessages([], 'Hello', 'CONTEXT');
    expect(messages[0]!.parts[0]!.text).toContain('CONTEXT');
    expect(messages[0]!.parts[0]!.text).toContain('Hello');
  });

  it('maps student entries to user messages', () => {
    const entries: LiveEntry[] = [
      makeLive('prose', 'Student writes', 'e1'),
    ];
    const messages = buildConversationMessages(entries, 'Latest');
    expect(messages[0]!.role).toBe('user');
    expect(messages[0]!.parts[0]!.text).toContain('[prose]');
    expect(messages[0]!.parts[0]!.text).toContain('Student writes');
  });

  it('maps tutor entries to model messages', () => {
    const entries: LiveEntry[] = [
      makeLive('tutor-marginalia', 'Tutor says', 'e1'),
    ];
    const messages = buildConversationMessages(entries, 'Latest');
    expect(messages[0]!.role).toBe('model');
    expect(messages[0]!.parts[0]!.text).toBe('Tutor says');
  });

  it('limits to last 12 entries', () => {
    const entries: LiveEntry[] = Array.from({ length: 20 }, (_, i) =>
      makeLive('prose', `Entry${i}`, `e${i}`),
    );
    const messages = buildConversationMessages(entries, 'Final');
    // 12 recent entries + 1 final = 13
    expect(messages).toHaveLength(13);
  });

  it('skips non-student non-tutor entries', () => {
    const entries: LiveEntry[] = [
      makeLive('silence', '', 'e1'),
      makeLive('divider', '', 'e2'),
    ];
    // silence and divider have no content field matching the check
    const messages = buildConversationMessages(entries, 'Hello');
    // Should just have the final user message
    expect(messages).toHaveLength(1);
  });

  it('interleaves student and tutor messages', () => {
    const entries: LiveEntry[] = [
      makeLive('prose', 'Q1', 'e1'),
      makeLive('tutor-marginalia', 'A1', 'e2'),
      makeLive('question', 'Q2', 'e3'),
    ];
    const messages = buildConversationMessages(entries, 'Q3');
    expect(messages[0]!.role).toBe('user');
    expect(messages[1]!.role).toBe('model');
    expect(messages[2]!.role).toBe('user');
    expect(messages[3]!.role).toBe('user'); // latest
  });
});
