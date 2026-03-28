import { describe, it, expect, vi } from 'vitest';
import {
  createCooldownStrategy,
  heuristicStrategy,
  runStrategyChain,
  applyOverrides,
  buildRoutingContext,
  type RoutingContext,
  type RoutingOverride,
} from '../routing-chain';
import type { RoutingDecision } from '../router-agent';

vi.mock('@/state', () => ({
  getSessionState: vi.fn(() => ({
    phase: 'exploring',
    studentTurnCount: 5,
    consecutiveTutorEntries: 0,
    activeConcepts: [],
    masterySnapshot: [],
  })),
}));

const baseDecision: RoutingDecision = {
  tutor: true,
  research: true,
  visualize: true,
  illustrate: false,
  deepMemory: false,
  directive: false,
  graphExplore: false,
  reason: 'test',
  source: 'router',
};

describe('routing-chain', () => {
  describe('buildRoutingContext', () => {
    it('computes word count from student text', () => {
      const ctx = buildRoutingContext('hello world foo', []);
      expect(ctx.wordCount).toBe(3);
    });

    it('detects question marks', () => {
      expect(buildRoutingContext('Is this a question?', []).hasQuestion).toBe(true);
      expect(buildRoutingContext('This is a statement', []).hasQuestion).toBe(false);
    });

    it('detects @mention syntax', () => {
      expect(buildRoutingContext('About @[Kepler](thinker:1)', []).mentionsConcept).toBe(true);
      expect(buildRoutingContext('About Kepler', []).mentionsConcept).toBe(false);
    });
  });

  describe('heuristicStrategy', () => {
    it('returns terminal override for short non-question input', () => {
      const ctx: RoutingContext = {
        studentText: 'ok', recentEntries: [],
        wordCount: 1, hasQuestion: false, mentionsConcept: false,
      };
      const result = heuristicStrategy.evaluate(ctx);
      expect(result).not.toBeNull();
      expect(result?.terminal).toBe(true);
      expect(result?.research).toBe(false);
    });

    it('returns null for longer input', () => {
      const ctx: RoutingContext = {
        studentText: 'Why do planets orbit in ellipses instead of circles?',
        recentEntries: [], wordCount: 9, hasQuestion: true, mentionsConcept: false,
      };
      expect(heuristicStrategy.evaluate(ctx)).toBeNull();
    });

    it('returns null for short questions', () => {
      const ctx: RoutingContext = {
        studentText: 'Why?', recentEntries: [],
        wordCount: 1, hasQuestion: true, mentionsConcept: false,
      };
      expect(heuristicStrategy.evaluate(ctx)).toBeNull();
    });
  });

  describe('createCooldownStrategy', () => {
    it('suppresses agents on cooldown', () => {
      const isOnCooldown = (agent: string) => agent === 'research';
      const strategy = createCooldownStrategy(isOnCooldown);

      const result = strategy.evaluate({
        studentText: '', recentEntries: [],
        wordCount: 0, hasQuestion: false, mentionsConcept: false,
      });
      expect(result?.research).toBe(false);
      expect(result?.visualize).toBeUndefined();
    });
  });

  describe('runStrategyChain', () => {
    it('stops at terminal override', () => {
      const terminal = {
        name: 'stopper',
        evaluate: () => ({ source: 'test', terminal: true, research: false } as RoutingOverride),
      };
      const neverReached = {
        name: 'unreachable',
        evaluate: vi.fn(() => null),
      };

      const ctx: RoutingContext = {
        studentText: '', recentEntries: [],
        wordCount: 0, hasQuestion: false, mentionsConcept: false,
      };

      const { overrides, skippedLLM } = runStrategyChain([terminal, neverReached], ctx);
      expect(skippedLLM).toBe(true);
      expect(overrides).toHaveLength(1);
      expect(neverReached.evaluate).not.toHaveBeenCalled();
    });

    it('accumulates non-terminal overrides', () => {
      const s1 = { name: 'a', evaluate: () => ({ source: 'a', research: false }) };
      const s2 = { name: 'b', evaluate: () => ({ source: 'b', visualize: true }) };
      const ctx: RoutingContext = {
        studentText: '', recentEntries: [],
        wordCount: 0, hasQuestion: false, mentionsConcept: false,
      };

      const { overrides, skippedLLM } = runStrategyChain([s1, s2], ctx);
      expect(skippedLLM).toBe(false);
      expect(overrides).toHaveLength(2);
    });

    it('skips strategies that return null', () => {
      const s1 = { name: 'pass', evaluate: () => null };
      const ctx: RoutingContext = {
        studentText: '', recentEntries: [],
        wordCount: 0, hasQuestion: false, mentionsConcept: false,
      };

      const { overrides } = runStrategyChain([s1], ctx);
      expect(overrides).toHaveLength(0);
    });
  });

  describe('applyOverrides', () => {
    it('applies research override', () => {
      const result = applyOverrides(baseDecision, [{ source: 'test', research: false }]);
      expect(result.research).toBe(false);
      expect(result.visualize).toBe(true); // unchanged
    });

    it('applies multiple overrides in order', () => {
      const overrides: RoutingOverride[] = [
        { source: 'a', research: false },
        { source: 'b', research: true, visualize: false },
      ];
      const result = applyOverrides(baseDecision, overrides);
      expect(result.research).toBe(true); // second override wins
      expect(result.visualize).toBe(false);
    });

    it('updates reason and source when override provides reason', () => {
      const result = applyOverrides(baseDecision, [
        { source: 'custom', reason: 'Cooldown active' },
      ]);
      expect(result.reason).toBe('Cooldown active');
      expect(result.source).toBe('router');
    });
  });
});
