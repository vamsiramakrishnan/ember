import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ROUTER_AGENT, isOnCooldown, markUsed } from '../router-config';

describe('router-config', () => {
  describe('ROUTER_AGENT', () => {
    it('has correct name and model', () => {
      expect(ROUTER_AGENT.name).toBe('Router');
      expect(ROUTER_AGENT.model).toBe('gemini-3.1-flash-lite-preview');
    });

    it('uses MINIMAL thinking for speed', () => {
      expect(ROUTER_AGENT.thinkingLevel).toBe('MINIMAL');
    });

    it('has no tools (classification only)', () => {
      expect(ROUTER_AGENT.tools).toEqual([]);
    });

    it('has a system instruction', () => {
      expect(ROUTER_AGENT.systemInstruction).toContain('routing classifier');
    });
  });

  describe('cooldown tracking', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('returns false when agent has never been used', () => {
      expect(isOnCooldown('never-used-agent')).toBe(false);
    });

    it('returns true immediately after marking as used', () => {
      vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
      markUsed('research');
      expect(isOnCooldown('research')).toBe(true);
    });

    it('returns false after cooldown period expires', () => {
      vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
      markUsed('research');
      // research cooldown is 30_000ms
      vi.advanceTimersByTime(31_000);
      expect(isOnCooldown('research')).toBe(false);
    });

    it('respects different cooldown periods per agent', () => {
      vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
      markUsed('research');    // 30s cooldown
      markUsed('visualize');   // 60s cooldown

      vi.advanceTimersByTime(35_000);
      expect(isOnCooldown('research')).toBe(false);
      expect(isOnCooldown('visualize')).toBe(true);
    });

    it('treats unknown agents as having no cooldown', () => {
      markUsed('unknown-agent');
      expect(isOnCooldown('unknown-agent')).toBe(false);
    });
  });
});
