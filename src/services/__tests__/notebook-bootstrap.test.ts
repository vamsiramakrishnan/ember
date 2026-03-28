/**
 * Tests for notebook-bootstrap — seeding new notebooks with AI context.
 */
import { describe, test, expect, vi, beforeEach } from 'vitest';

vi.mock('../agents', () => ({
  BOOTSTRAP_AGENT: { name: 'mock-bootstrap' },
}));

vi.mock('../resilient-agent', () => ({
  resilientTextAgent: vi.fn(),
}));

vi.mock('../gemini', () => ({
  isGeminiAvailable: vi.fn(() => true),
  MODELS: { text: 'test', heavy: 'test', image: 'test', fallback: 'test', gemma: 'test' },
  getGeminiClient: vi.fn(() => null),
}));

vi.mock('@/persistence', () => ({
  Store: { Encounters: 'e', Lexicon: 'l', Mastery: 'm', Library: 'lib', Curiosities: 'c' },
  notify: vi.fn(),
}));

vi.mock('@/persistence/repositories/lexicon', () => ({
  createLexiconEntry: vi.fn(async () => ({ id: 'lex1' })),
}));

vi.mock('@/persistence/repositories/encounters', () => ({
  createEncounter: vi.fn(async () => ({ id: 'enc1' })),
}));

vi.mock('@/persistence/repositories/library', () => ({
  createLibraryEntry: vi.fn(async () => ({ id: 'lib1' })),
}));

vi.mock('@/persistence/repositories/mastery', () => ({
  upsertMastery: vi.fn(async () => ({ id: 'mas1' })),
  createCuriosity: vi.fn(async () => ({ id: 'cur1' })),
}));

import { bootstrapNotebook } from '../notebook-bootstrap';
import { resilientTextAgent } from '../resilient-agent';
import { isGeminiAvailable } from '../gemini';
import { createLexiconEntry } from '@/persistence/repositories/lexicon';

const mockResilent = vi.mocked(resilientTextAgent);
const mockIsAvailable = vi.mocked(isGeminiAvailable);

describe('bootstrapNotebook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsAvailable.mockReturnValue(true);
  });

  test('returns not seeded when AI unavailable', async () => {
    mockIsAvailable.mockReturnValue(false);

    const result = await bootstrapNotebook('s1', 'nb1', 'Math', 'Why calculus?');
    expect(result.opening).toBeNull();
    expect(result.seeded).toBe(false);
  });

  test('returns opening and seeded on success', async () => {
    mockResilent.mockResolvedValue({
      text: JSON.stringify({
        opening: 'Welcome to math',
        thinkers: [{ name: 'Newton', dates: '1643-1727', tradition: 'physics', coreIdea: 'calculus', gift: 'motion', bridge: 'limits' }],
        vocabulary: [{ term: 'derivative', pronunciation: '/dɪˈrɪvətɪv/', definition: 'rate of change', etymology: 'Latin derivare' }],
        concepts: [{ concept: 'limits', level: 'exploring', percentage: 5 }],
        library: [{ title: 'Principia', author: 'Newton', quote: 'If I have seen further...' }],
        curiosities: ['What is infinity?'],
      }),
      citations: [],
    });

    const result = await bootstrapNotebook('s1', 'nb1', 'Math', 'Why calculus?');
    expect(result.opening).toBe('Welcome to math');
    expect(result.seeded).toBe(true);
  });

  test('returns not seeded when response is not JSON', async () => {
    mockResilent.mockResolvedValue({ text: 'not json', citations: [] });

    const result = await bootstrapNotebook('s1', 'nb1', 'Math', '');
    expect(result.opening).toBeNull();
    expect(result.seeded).toBe(false);
  });

  test('returns not seeded on error', async () => {
    mockResilent.mockRejectedValue(new Error('fail'));

    const result = await bootstrapNotebook('s1', 'nb1', 'Math', 'q');
    expect(result.opening).toBeNull();
    expect(result.seeded).toBe(false);
  });

  test('seeds vocabulary entries', async () => {
    mockResilent.mockResolvedValue({
      text: JSON.stringify({
        vocabulary: [
          { term: 'a', pronunciation: 'a', definition: 'd1', etymology: 'e1' },
          { term: 'b', pronunciation: 'b', definition: 'd2', etymology: 'e2' },
        ],
      }),
      citations: [],
    });

    await bootstrapNotebook('s1', 'nb1', 'Math', 'q');
    expect(createLexiconEntry).toHaveBeenCalledTimes(2);
  });
});
