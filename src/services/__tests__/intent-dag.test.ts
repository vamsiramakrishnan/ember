/**
 * Tests for intent-dag.ts — LLM-powered intent parsing.
 * Tests the deterministic parts: likelyCompound, fallbackDAG, schema validation.
 */
import { describe, it, expect, vi } from 'vitest';
import { likelyCompound, intentDagSchema, parseIntentDAG } from '../intent-dag';

// Mock the agent runner to avoid real API calls
vi.mock('../agents', () => ({
  micro: vi.fn(() => ({ model: 'test', systemInstruction: '' })),
}));

vi.mock('../run-agent', () => ({
  runTextAgent: vi.fn(() => Promise.reject(new Error('mocked'))),
}));

describe('likelyCompound', () => {
  it('returns true for multiple slash commands', () => {
    expect(likelyCompound('/research gravity /visualize orbits')).toBe(true);
  });

  it('returns true for slash command + question', () => {
    expect(likelyCompound('What is gravity? /visualize')).toBe(true);
  });

  it('returns true for "and /" pattern', () => {
    expect(likelyCompound('/research gravity and /summarize')).toBe(true);
  });

  it('returns false for simple text', () => {
    expect(likelyCompound('What is gravity?')).toBe(false);
  });

  it('returns false for single slash command without question', () => {
    expect(likelyCompound('/research gravity')).toBe(false);
  });

  it('ignores non-matching slash words', () => {
    expect(likelyCompound('/unknown /other')).toBe(false);
  });

  it('matches all known commands', () => {
    const cmds = [
      'draw', 'visualize', 'research', 'explain', 'summarize',
      'quiz', 'timeline', 'connect', 'define', 'teach',
      'podcast', 'flashcards', 'exercise',
    ];
    for (const cmd of cmds) {
      expect(likelyCompound(`/${cmd} topic and /${cmd} other`)).toBe(true);
    }
  });
});

describe('intentDagSchema', () => {
  it('validates a simple single-node DAG', () => {
    const dag = {
      nodes: [{
        id: 'n0', action: 'respond', content: 'Hello',
        entities: [], dependsOn: [], parallel: false, label: 'responding',
      }],
      rootId: 'n0',
      isCompound: false,
      summary: 'Student says hello',
    };
    expect(() => intentDagSchema.parse(dag)).not.toThrow();
  });

  it('validates a compound DAG', () => {
    const dag = {
      nodes: [
        {
          id: 'n0', action: 'respond', content: 'Question',
          entities: [{ name: 'Kepler', entityType: 'thinker', entityId: 'k1' }],
          dependsOn: [], parallel: false, label: 'answering',
        },
        {
          id: 'n1', action: 'visualize', content: 'diagram',
          entities: [], dependsOn: ['n0'], parallel: true, label: 'mapping',
        },
      ],
      rootId: 'n0',
      isCompound: true,
      summary: 'Question with visualization',
    };
    expect(() => intentDagSchema.parse(dag)).not.toThrow();
  });

  it('rejects invalid action types', () => {
    const dag = {
      nodes: [{
        id: 'n0', action: 'invalid_action', content: 'test',
        entities: [], dependsOn: [], parallel: false, label: 'test',
      }],
      rootId: 'n0', isCompound: false, summary: 'test',
    };
    expect(() => intentDagSchema.parse(dag)).toThrow();
  });

  it('rejects invalid entity types', () => {
    const dag = {
      nodes: [{
        id: 'n0', action: 'respond', content: 'test',
        entities: [{ name: 'X', entityType: 'invalid', entityId: '' }],
        dependsOn: [], parallel: false, label: 'test',
      }],
      rootId: 'n0', isCompound: false, summary: 'test',
    };
    expect(() => intentDagSchema.parse(dag)).toThrow();
  });
});

describe('parseIntentDAG', () => {
  it('falls back to single-node DAG on failure', async () => {
    const result = await parseIntentDAG('What is gravity?', []);
    expect(result.nodes).toHaveLength(1);
    expect(result.nodes[0].action).toBe('respond');
    expect(result.nodes[0].content).toBe('What is gravity?');
    expect(result.isCompound).toBe(false);
    expect(result.rootId).toBe('n0');
  });

  it('truncates summary in fallback', async () => {
    const longText = 'A'.repeat(200);
    const result = await parseIntentDAG(longText, []);
    expect(result.summary.length).toBeLessThanOrEqual(80);
  });
});
