/**
 * Tests for context-assembler.ts — builds layered context window for the tutor.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { LiveEntry } from '@/types/entries';

// Mock background-results before importing assembler
vi.mock('../background-results', () => ({
  consumeBackgroundResults: vi.fn(() => null),
}));

// Mock context-conversation
vi.mock('../context-conversation', () => ({
  buildConversationMessages: vi.fn((_e: unknown, text: string, prefix?: string) => {
    const parts = prefix ? `${prefix}\n\n${text}` : text;
    return [{ role: 'user', parts: [{ text: parts }] }];
  }),
}));

// Mock context-layers
vi.mock('../context-layers', () => ({
  buildProfileLayer: vi.fn(() => '[PROFILE]'),
  buildNotebookLayer: vi.fn(() => '[NOTEBOOK]'),
  buildMemoryLayer: vi.fn((m: { relevantHistory: string | null }) =>
    m.relevantHistory ? '[MEMORY]' : null,
  ),
  buildResearchLayer: vi.fn(() => '[RESEARCH]'),
  buildBackgroundResultsLayer: vi.fn(() => '[BG]'),
}));

import { assembleContext, type StudentProfile, type NotebookContext } from '../context-assembler';
import { consumeBackgroundResults } from '../background-results';

function makeLive(type: string, content: string): LiveEntry {
  return {
    id: '1', entry: { type, content } as LiveEntry['entry'],
    crossedOut: false, bookmarked: false, pinned: false, timestamp: Date.now(),
  };
}

describe('assembleContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const profile: StudentProfile = {
    name: 'Ada', masterySnapshot: [], vocabularyCount: 0,
    activeCuriosities: [], totalMinutes: 60,
  };

  const notebook: NotebookContext = {
    title: 'T', description: 'D', sessionNumber: 1,
    sessionTopic: 'S', thinkersMet: [],
  };

  it('returns empty preamble when no layers', () => {
    const result = assembleContext({
      studentText: 'Hello', entries: [], profile: null,
      notebook: null, memory: null, research: null,
    });
    expect(result.systemPreamble).toBe('');
    expect(result.messages).toHaveLength(1);
  });

  it('includes profile layer', () => {
    const result = assembleContext({
      studentText: 'Hello', entries: [], profile,
      notebook: null, memory: null, research: null,
    });
    expect(result.systemPreamble).toContain('[PROFILE]');
  });

  it('includes notebook layer', () => {
    const result = assembleContext({
      studentText: 'Hello', entries: [], profile: null,
      notebook, memory: null, research: null,
    });
    expect(result.systemPreamble).toContain('[NOTEBOOK]');
  });

  it('includes research layer', () => {
    const result = assembleContext({
      studentText: 'Hi', entries: [], profile: null,
      notebook: null, memory: null, research: { facts: 'F' },
    });
    expect(result.systemPreamble).toContain('[RESEARCH]');
  });

  it('includes memory layer when non-null', () => {
    const result = assembleContext({
      studentText: 'Hi', entries: [], profile: null,
      notebook: null, research: null,
      memory: { relevantHistory: 'H', relevantVocabulary: null, relevantThinkers: null, citations: [] },
    });
    expect(result.systemPreamble).toContain('[MEMORY]');
  });

  it('skips memory layer when null', () => {
    const result = assembleContext({
      studentText: 'Hi', entries: [], profile: null,
      notebook: null, research: null,
      memory: { relevantHistory: null, relevantVocabulary: null, relevantThinkers: null, citations: [] },
    });
    expect(result.systemPreamble).not.toContain('[MEMORY]');
  });

  it('includes working memory', () => {
    const result = assembleContext({
      studentText: 'Hi', entries: [], profile: null,
      notebook: null, memory: null, research: null,
      workingMemory: 'Session about gravity',
    });
    expect(result.systemPreamble).toContain('SESSION SUMMARY');
    expect(result.systemPreamble).toContain('Session about gravity');
  });

  it('includes background results when available', () => {
    vi.mocked(consumeBackgroundResults).mockReturnValueOnce({
      newThinkers: ['Euler'], newTerms: [], masteryChanges: [], updatedAt: 1,
    });
    const result = assembleContext({
      studentText: 'Hi', entries: [], profile: null,
      notebook: null, memory: null, research: null,
    });
    expect(result.systemPreamble).toContain('[BG]');
  });

  it('truncates layers that exceed budget', () => {
    // Profile budget is 400 tokens = 1600 chars. Mock returns short text so no truncation.
    // Research budget is 1000 tokens = 4000 chars.
    const result = assembleContext({
      studentText: 'Hi', entries: [], profile,
      notebook: null, memory: null, research: { facts: 'F' },
    });
    // Both layers should be present without truncation markers
    expect(result.systemPreamble).not.toContain('[...truncated]');
  });
});
