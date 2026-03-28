import { describe, test, expect, vi, beforeEach } from 'vitest';

vi.mock('@/services/notebook-branch', () => ({
  branchNotebook: vi.fn().mockResolvedValue({
    notebook: { id: 'nb2', title: 'Branched' },
  }),
}));
vi.mock('@/state', () => ({
  addRelation: vi.fn(),
}));

import { deriveMarginalRef, handleSelectionAction, handleFollowUp } from '../notebook-handlers';
import type { LiveEntry, NotebookEntry } from '@/types/entries';

function makeLive(entry: Record<string, unknown>, id = 'e1'): LiveEntry {
  return {
    id,
    entry: entry as LiveEntry['entry'],
    crossedOut: false,
    bookmarked: false,
    pinned: false,
    annotations: [],
    timestamp: Date.now(),
  };
}

describe('notebook-handlers', () => {
  describe('deriveMarginalRef', () => {
    test('returns null for empty entries', () => {
      expect(deriveMarginalRef([])).toBeNull();
    });

    test('returns connection content when present', () => {
      const entries = [
        makeLive({ type: 'prose', content: 'Hello' }),
        makeLive({ type: 'tutor-connection', content: 'A connection note', emphasisEnd: 5 }, 'e2'),
      ];
      expect(deriveMarginalRef(entries)).toBe('A connection note');
    });

    test('returns echo content when present', () => {
      const entries = [
        makeLive({ type: 'echo', content: 'An echo' }),
      ];
      expect(deriveMarginalRef(entries)).toBe('An echo');
    });

    test('truncates long connection content', () => {
      const long = 'x'.repeat(200);
      const entries = [
        makeLive({ type: 'tutor-connection', content: long, emphasisEnd: 5 }),
      ];
      const result = deriveMarginalRef(entries);
      expect(result).not.toBeNull();
      expect(result!.length).toBeLessThanOrEqual(121);
    });

    test('returns null when no connection or echo', () => {
      const entries = [
        makeLive({ type: 'prose', content: 'Hello' }),
        makeLive({ type: 'tutor-marginalia', content: 'Comment' }, 'e2'),
      ];
      expect(deriveMarginalRef(entries)).toBeNull();
    });
  });

  describe('handleSelectionAction', () => {
    let deps: Parameters<typeof handleSelectionAction>[0];

    beforeEach(() => {
      deps = {
        annotate: vi.fn().mockResolvedValue(undefined),
        submitEntry: vi.fn(),
        addEntry: vi.fn(),
        requestInlineExplain: vi.fn(),
        popup: { handleMentionTrigger: vi.fn() },
      };
    });

    test('handles explain action', () => {
      handleSelectionAction(deps, 'e1', 'explain', 'selected text');
      expect(deps.addEntry).toHaveBeenCalledWith({ type: 'silence', text: 'reading…' });
      expect(deps.requestInlineExplain).toHaveBeenCalledWith('selected text', 'e1');
    });

    test('handles link action', () => {
      handleSelectionAction(deps, 'e1', 'link', 'some reference');
      expect(deps.popup.handleMentionTrigger).toHaveBeenCalled();
    });

    test('handles annotate action', () => {
      handleSelectionAction(deps, 'e1', 'annotate', 'important');
      expect(deps.annotate).toHaveBeenCalledWith('e1', 'Note on: "important"');
    });

    test('handles highlight action', () => {
      handleSelectionAction(deps, 'e1', 'highlight', 'key phrase');
      expect(deps.annotate).toHaveBeenCalledWith('e1', '"key phrase"');
    });

    test('handles ask action', () => {
      handleSelectionAction(deps, 'e1', 'ask', 'Why is the sky blue?');
      expect(deps.submitEntry).toHaveBeenCalledWith({
        type: 'question',
        content: 'Why is the sky blue?',
      });
    });
  });

  describe('handleFollowUp', () => {
    test('submits a question with context', () => {
      const submitEntry = vi.fn();
      const entries: LiveEntry[] = [];
      handleFollowUp(submitEntry, entries, 'But why?', 'Tutor said something');
      expect(submitEntry).toHaveBeenCalledWith({
        type: 'question',
        content: expect.stringContaining('But why?'),
      });
    });
  });
});
