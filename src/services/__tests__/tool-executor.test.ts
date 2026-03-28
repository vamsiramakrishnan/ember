import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeTool, extractDeferredActions } from '../tool-executor';
import type { ToolContext } from '../tool-executor';

vi.mock('../tool-impls', () => ({
  executeSearch: vi.fn(() => Promise.resolve('{"status":"ok","data":"found"}')),
  lookupConcept: vi.fn(() => Promise.resolve('{"status":"ok","data":"{}"}')),
  lookupThinker: vi.fn(() => Promise.resolve('{"status":"ok","data":"{}"}')),
  lookupTerm: vi.fn(() => Promise.resolve('{"status":"ok","data":"{}"}')),
  getConnections: vi.fn(() => Promise.resolve('{"status":"ok","data":"{}"}')),
  getRecentChanges: vi.fn(() => Promise.resolve('{"status":"ok","data":"{}"}')),
}));

vi.mock('../tool-impls-content', () => ({
  getEntryContent: vi.fn(() => Promise.resolve('entry content')),
  readFileContent: vi.fn(() => Promise.resolve('file content')),
}));

vi.mock('../graph-tools', () => ({
  GRAPH_TOOL_DECLARATIONS: [],
  executeGraphTool: vi.fn(() => Promise.resolve('graph result')),
  extractGraphDeferred: vi.fn(() => null),
  executeGraphDeferred: vi.fn(),
}));

vi.mock('../retry', () => ({
  withRetry: vi.fn((_name: string, fn: () => Promise<string>) => fn()),
}));

const ctx: ToolContext = { studentId: 's1', notebookId: 'n1' };

describe('tool-executor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('executeTool', () => {
    it('routes search_history to executeSearch', async () => {
      const { executeSearch } = await import('../tool-impls');
      await executeTool('search_history', { query: 'Kepler' }, ctx);
      expect(executeSearch).toHaveBeenCalledWith({ query: 'Kepler' }, ctx);
    });

    it('routes lookup_concept correctly', async () => {
      const { lookupConcept } = await import('../tool-impls');
      await executeTool('lookup_concept', { concept: 'harmonics' }, ctx);
      expect(lookupConcept).toHaveBeenCalledWith('harmonics', ctx);
    });

    it('routes lookup_thinker correctly', async () => {
      const { lookupThinker } = await import('../tool-impls');
      await executeTool('lookup_thinker', { thinker: 'Euler' }, ctx);
      expect(lookupThinker).toHaveBeenCalledWith('Euler', ctx);
    });

    it('routes lookup_term correctly', async () => {
      const { lookupTerm } = await import('../tool-impls');
      await executeTool('lookup_term', { term: 'ratio' }, ctx);
      expect(lookupTerm).toHaveBeenCalledWith('ratio', ctx);
    });

    it('routes get_connections with default depth', async () => {
      const { getConnections } = await import('../tool-impls');
      await executeTool('get_connections', { entity: 'Kepler' }, ctx);
      expect(getConnections).toHaveBeenCalledWith('Kepler', 1, ctx);
    });

    it('routes get_recent_changes with default minutes', async () => {
      const { getRecentChanges } = await import('../tool-impls');
      await executeTool('get_recent_changes', {}, ctx);
      expect(getRecentChanges).toHaveBeenCalledWith(30, ctx);
    });

    it('routes get_entry_content correctly', async () => {
      const { getEntryContent } = await import('../tool-impls-content');
      await executeTool('get_entry_content', { entry_id: 'e1' }, ctx);
      expect(getEntryContent).toHaveBeenCalledWith('e1');
    });

    it('routes read_file_content correctly', async () => {
      const { readFileContent } = await import('../tool-impls-content');
      await executeTool('read_file_content', { entry_id: 'f1' }, ctx);
      expect(readFileContent).toHaveBeenCalledWith('f1');
    });

    it('handles create_annotation by returning queued response', async () => {
      const result = await executeTool('create_annotation', {
        entry_id: 'e1', content: 'note',
      }, ctx);
      const parsed = JSON.parse(JSON.parse(result).data);
      expect(parsed.queued).toBe(true);
    });

    it('handles add_to_lexicon by returning queued response', async () => {
      const result = await executeTool('add_to_lexicon', {
        term: 'ratio', definition: 'a proportion',
      }, ctx);
      const parsed = JSON.parse(JSON.parse(result).data);
      expect(parsed.queued).toBe(true);
    });

    it('returns error for unknown tool', async () => {
      const result = await executeTool('unknown_tool', {}, ctx);
      const parsed = JSON.parse(result);
      expect(parsed.status).toBe('error');
    });

    it('routes graph tools to executeGraphTool', async () => {
      const { executeGraphTool } = await import('../graph-tools');
      await executeTool('traverse_graph', { entity: 'x' }, ctx);
      expect(executeGraphTool).toHaveBeenCalled();
    });
  });

  describe('extractDeferredActions', () => {
    it('returns annotate action for create_annotation', () => {
      const result = extractDeferredActions('create_annotation', { entry_id: 'e1', content: 'note' });
      expect(result).toEqual({ type: 'annotate', args: { entry_id: 'e1', content: 'note' } });
    });

    it('returns add_lexicon action for add_to_lexicon', () => {
      const result = extractDeferredActions('add_to_lexicon', { term: 'ratio', definition: 'a/b' });
      expect(result).toEqual({ type: 'add_lexicon', args: { term: 'ratio', definition: 'a/b' } });
    });

    it('returns null for unknown functions', () => {
      const result = extractDeferredActions('search_history', { query: 'test' });
      expect(result).toBeNull();
    });
  });
});
