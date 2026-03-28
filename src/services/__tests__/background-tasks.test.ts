import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../gemini', () => ({
  isGeminiAvailable: vi.fn(() => true),
  MODELS: {
    text: 'gemini-3.1-flash-lite-preview',
    heavy: 'gemini-3-flash-preview',
    fallback: 'gemini-2.5-flash-lite',
  },
}));

vi.mock('../run-agent', () => ({
  runTextAgent: vi.fn(() =>
    Promise.resolve({
      text: JSON.stringify({
        updateThinkers: true,
        updateVocabulary: false,
        updateMastery: false,
        updateCuriosities: false,
      }),
      citations: [],
    }),
  ),
}));

vi.mock('../agents', () => ({
  micro: vi.fn(() => ({
    name: 'micro', model: 'test', systemInstruction: 'test',
    thinkingLevel: 'MINIMAL', tools: [], responseModalities: ['TEXT'],
  })),
}));

vi.mock('@/persistence', () => ({
  Store: { Encounters: 'encounters', Lexicon: 'lexicon', Mastery: 'mastery' },
  notify: vi.fn(),
}));

vi.mock('@/persistence/repositories/encounters', () => ({
  createEncounter: vi.fn(() => Promise.resolve()),
  getEncountersByNotebook: vi.fn(() => Promise.resolve([])),
}));

vi.mock('@/persistence/repositories/lexicon', () => ({
  createLexiconEntry: vi.fn(() => Promise.resolve()),
  getLexiconByNotebook: vi.fn(() => Promise.resolve([])),
}));

vi.mock('@/persistence/repositories/mastery', () => ({
  upsertMastery: vi.fn(() => Promise.resolve()),
}));

vi.mock('../schemas', () => ({
  taskSignalsSchema: {},
  thinkerExtractionSchema: {},
  vocabExtractionSchema: {},
  masteryUpdateSchema: {},
}));

import { assessTasks, extractThinkers, extractVocabulary, updateMasteryFromEntry } from '../background-tasks';
import { isGeminiAvailable } from '../gemini';
import { runTextAgent } from '../run-agent';
import { createEncounter, getEncountersByNotebook } from '@/persistence/repositories/encounters';
import { createLexiconEntry } from '@/persistence/repositories/lexicon';
import { upsertMastery } from '@/persistence/repositories/mastery';
import { notify } from '@/persistence';

describe('background-tasks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('assessTasks', () => {
    it('returns no tasks when Gemini is unavailable', async () => {
      (isGeminiAvailable as ReturnType<typeof vi.fn>).mockReturnValueOnce(false);
      const result = await assessTasks('student text', []);
      expect(result.updateThinkers).toBe(false);
      expect(result.updateVocabulary).toBe(false);
    });

    it('returns parsed task signals from LLM', async () => {
      const result = await assessTasks('student text', []);
      expect(result.updateThinkers).toBe(true);
      expect(result.updateVocabulary).toBe(false);
    });

    it('returns no tasks on parse failure', async () => {
      (runTextAgent as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        text: 'not json', citations: [],
      });
      const result = await assessTasks('student text', []);
      expect(result.updateThinkers).toBe(false);
    });
  });

  describe('extractThinkers', () => {
    it('extracts and persists new thinkers', async () => {
      (runTextAgent as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        text: JSON.stringify({
          thinkers: [{ name: 'Kepler', tradition: 'Astronomy', coreIdea: 'Planetary motion' }],
        }),
        citations: [],
      });

      const count = await extractThinkers('Kepler studied orbits', 's1', 'n1', 'Astronomy');
      expect(count).toBe(1);
      expect(createEncounter).toHaveBeenCalled();
      expect(notify).toHaveBeenCalled();
    });

    it('skips already-known thinkers', async () => {
      (getEncountersByNotebook as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
        { thinker: 'Kepler' },
      ]);
      (runTextAgent as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        text: JSON.stringify({ thinkers: [{ name: 'Kepler' }] }),
        citations: [],
      });

      const count = await extractThinkers('Kepler', 's1', 'n1', 'Astronomy');
      expect(count).toBe(0);
      expect(createEncounter).not.toHaveBeenCalled();
    });

    it('returns 0 when no thinkers extracted', async () => {
      (runTextAgent as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        text: JSON.stringify({ thinkers: [] }),
        citations: [],
      });
      const count = await extractThinkers('hello', 's1', 'n1', 'topic');
      expect(count).toBe(0);
    });
  });

  describe('extractVocabulary', () => {
    it('extracts and persists new vocabulary', async () => {
      (runTextAgent as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        text: JSON.stringify({
          terms: [{ term: 'harmonic', definition: 'a frequency multiple' }],
        }),
        citations: [],
      });

      const count = await extractVocabulary('harmonic series', 's1', 'n1');
      expect(count).toBe(1);
      expect(createLexiconEntry).toHaveBeenCalled();
    });
  });

  describe('updateMasteryFromEntry', () => {
    it('updates mastery when changes detected', async () => {
      (runTextAgent as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        text: JSON.stringify({
          updates: [{ concept: 'Ratio', level: 'strong', percentage: 70 }],
        }),
        citations: [],
      });

      const count = await updateMasteryFromEntry('I understand ratios', 'Ratio: developing (40%)', 's1', 'n1');
      expect(count).toBe(1);
      expect(upsertMastery).toHaveBeenCalledWith(
        expect.objectContaining({ concept: 'Ratio', level: 'strong', percentage: 70 }),
      );
    });

    it('skips updates with missing concept or level', async () => {
      (runTextAgent as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        text: JSON.stringify({ updates: [{ concept: '' }] }),
        citations: [],
      });

      const count = await updateMasteryFromEntry('text', 'existing', 's1', 'n1');
      expect(count).toBe(0);
    });
  });
});
