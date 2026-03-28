import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/persistence', () => ({
  Store: { Entries: 'entries', Lexicon: 'lexicon' },
  notify: vi.fn(),
}));

vi.mock('@/persistence/repositories/entries', () => ({
  getEntry: vi.fn(),
  updateEntry: vi.fn(() => Promise.resolve()),
}));

vi.mock('@/persistence/repositories/lexicon', () => ({
  createLexiconEntry: vi.fn(() => Promise.resolve()),
  getLexiconByNotebook: vi.fn(() => Promise.resolve([])),
}));

vi.mock('@/persistence/repositories/graph', () => ({
  createRelation: vi.fn(() => Promise.resolve()),
}));

vi.mock('@/persistence/ids', () => ({
  createId: vi.fn(() => 'test-id'),
}));

vi.mock('../graph-tools', () => ({
  executeGraphDeferred: vi.fn(() => Promise.resolve()),
}));

import { executeDeferredAction, executeAllDeferred } from '../deferred-executor';
import { getEntry, updateEntry } from '@/persistence/repositories/entries';
import { createLexiconEntry, getLexiconByNotebook } from '@/persistence/repositories/lexicon';
import { notify } from '@/persistence';
import type { DeferredAction } from '../tool-executor';

describe('deferred-executor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('executeDeferredAction', () => {
    it('creates annotation for annotate action', async () => {
      (getEntry as ReturnType<typeof vi.fn>).mockResolvedValue({
        entry: { type: 'prose', content: 'test' },
        annotations: [],
        sessionId: 'session-1',
      });

      await executeDeferredAction(
        { type: 'annotate', args: { entry_id: 'e1', content: 'note' } },
        's1', 'n1',
      );
      expect(updateEntry).toHaveBeenCalledWith('e1', expect.objectContaining({
        annotations: expect.arrayContaining([
          expect.objectContaining({ content: 'note', author: 'tutor' }),
        ]),
      }));
      expect(notify).toHaveBeenCalled();
    });

    it('skips annotation when entry not found', async () => {
      (getEntry as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      await executeDeferredAction(
        { type: 'annotate', args: { entry_id: 'missing', content: 'note' } },
        's1', 'n1',
      );
      expect(updateEntry).not.toHaveBeenCalled();
    });

    it('skips annotation when content is empty', async () => {
      await executeDeferredAction(
        { type: 'annotate', args: { entry_id: 'e1', content: '' } },
        's1', 'n1',
      );
      expect(getEntry).not.toHaveBeenCalled();
    });

    it('creates lexicon entry for add_lexicon action', async () => {
      await executeDeferredAction(
        { type: 'add_lexicon', args: { term: 'ratio', definition: 'a/b' } },
        's1', 'n1',
      );
      expect(createLexiconEntry).toHaveBeenCalledWith(
        expect.objectContaining({ term: 'ratio', definition: 'a/b' }),
      );
      expect(notify).toHaveBeenCalled();
    });

    it('skips duplicate lexicon entries', async () => {
      (getLexiconByNotebook as ReturnType<typeof vi.fn>).mockResolvedValue([
        { term: 'Ratio' },
      ]);

      await executeDeferredAction(
        { type: 'add_lexicon', args: { term: 'ratio', definition: 'a/b' } },
        's1', 'n1',
      );
      expect(createLexiconEntry).not.toHaveBeenCalled();
    });

    it('handles actions without type gracefully', async () => {
      await expect(
        executeDeferredAction({} as DeferredAction, 's1', 'n1'),
      ).resolves.not.toThrow();
    });
  });

  describe('executeAllDeferred', () => {
    it('executes multiple actions', async () => {
      const actions: DeferredAction[] = [
        { type: 'add_lexicon', args: { term: 'a', definition: 'b' } },
        { type: 'add_lexicon', args: { term: 'c', definition: 'd' } },
      ];

      await executeAllDeferred(actions, 's1', 'n1');
      expect(createLexiconEntry).toHaveBeenCalledTimes(2);
    });

    it('continues on individual action failure', async () => {
      (getLexiconByNotebook as ReturnType<typeof vi.fn>)
        .mockRejectedValueOnce(new Error('db error'))
        .mockResolvedValueOnce([]);

      const actions: DeferredAction[] = [
        { type: 'add_lexicon', args: { term: 'fail', definition: 'x' } },
        { type: 'add_lexicon', args: { term: 'succeed', definition: 'y' } },
      ];

      await expect(executeAllDeferred(actions, 's1', 'n1')).resolves.not.toThrow();
    });
  });
});
