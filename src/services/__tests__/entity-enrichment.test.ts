/**
 * Tests for entity-enrichment — @ mention entity creation and enrichment.
 */
import { describe, test, expect, vi, beforeEach } from 'vitest';

vi.mock('../gemini', () => ({
  isGeminiAvailable: vi.fn(() => true),
}));

vi.mock('../run-agent', () => ({
  runTextAgent: vi.fn(),
}));

vi.mock('../agents', () => ({
  micro: vi.fn(() => ({ name: 'mock-micro' })),
  TOOLS: { googleSearch: { googleSearch: {} } },
}));

vi.mock('../schemas', () => ({
  entityEnrichmentSchema: {},
}));

vi.mock('@/persistence', () => ({
  Store: { Encounters: 'encounters', Lexicon: 'lexicon', Mastery: 'mastery' },
  notify: vi.fn(),
}));

vi.mock('@/persistence/repositories/encounters', () => ({
  createEncounter: vi.fn(async () => ({ id: 'enc1', thinker: 'Euler', coreIdea: 'analysis' })),
  getEncountersByNotebook: vi.fn(async () => []),
}));

vi.mock('@/persistence/repositories/lexicon', () => ({
  createLexiconEntry: vi.fn(async () => ({ id: 'lex1', term: 'entropy', definition: 'disorder' })),
  getLexiconByNotebook: vi.fn(async () => []),
}));

vi.mock('@/persistence/repositories/mastery', () => ({
  upsertMastery: vi.fn(async () => ({ id: 'mas1', concept: 'gravity' })),
}));

import { createStub, enrichEntity } from '../entity-enrichment';

describe('createStub', () => {
  test('creates stub with expected properties', () => {
    const stub = createStub('Euler', 'nb1');
    expect(stub.name).toBe('Euler');
    expect(stub.notebookId).toBe('nb1');
    expect(stub.enriching).toBe(true);
    expect(stub.type).toBe('concept');
    expect(stub.id).toMatch(/^stub-/);
  });

  test('generates unique ids', () => {
    const a = createStub('A', 'nb1');
    const b = createStub('B', 'nb1');
    expect(a.id).not.toBe(b.id);
  });
});

describe('enrichEntity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('returns null when AI not available', async () => {
    const gemini = await import('../gemini');
    vi.mocked(gemini.isGeminiAvailable).mockReturnValue(false);

    const result = await enrichEntity('Euler', 'context', 's1', 'nb1', 'topic');
    expect(result).toBeNull();
  });

  test('persists thinker when kind is thinker', async () => {
    const gemini = await import('../gemini');
    vi.mocked(gemini.isGeminiAvailable).mockReturnValue(true);

    const { runTextAgent } = await import('../run-agent');
    vi.mocked(runTextAgent).mockResolvedValue({
      text: JSON.stringify({
        kind: 'thinker', name: 'Euler', tradition: 'mathematics',
        coreIdea: 'analysis', detail: 'Great mathematician',
      }),
      citations: [],
    });

    const result = await enrichEntity('Euler', 'context', 's1', 'nb1', 'topic');
    expect(result).not.toBeNull();
    expect(result?.entity.type).toBe('thinker');
  });

  test('persists term when kind is term', async () => {
    const gemini = await import('../gemini');
    vi.mocked(gemini.isGeminiAvailable).mockReturnValue(true);

    const { runTextAgent } = await import('../run-agent');
    vi.mocked(runTextAgent).mockResolvedValue({
      text: JSON.stringify({
        kind: 'term', name: 'entropy', definition: 'disorder measure',
        detail: 'thermodynamic concept',
      }),
      citations: [],
    });

    const result = await enrichEntity('entropy', 'context', 's1', 'nb1', 'topic');
    expect(result).not.toBeNull();
    expect(result?.entity.type).toBe('term');
  });

  test('persists concept for other kinds', async () => {
    const gemini = await import('../gemini');
    vi.mocked(gemini.isGeminiAvailable).mockReturnValue(true);

    const { runTextAgent } = await import('../run-agent');
    vi.mocked(runTextAgent).mockResolvedValue({
      text: JSON.stringify({
        kind: 'concept', name: 'gravity', detail: 'fundamental force',
      }),
      citations: [],
    });

    const result = await enrichEntity('gravity', 'context', 's1', 'nb1', 'topic');
    expect(result).not.toBeNull();
    expect(result?.entity.type).toBe('concept');
  });

  test('returns null on error', async () => {
    const gemini = await import('../gemini');
    vi.mocked(gemini.isGeminiAvailable).mockReturnValue(true);

    const { runTextAgent } = await import('../run-agent');
    vi.mocked(runTextAgent).mockRejectedValue(new Error('fail'));

    const result = await enrichEntity('test', 'ctx', 's1', 'nb1', 'topic');
    expect(result).toBeNull();
  });
});
