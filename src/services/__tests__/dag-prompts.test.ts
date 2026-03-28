/**
 * Tests for dag-prompts.ts — maps actions to formatted prompt strings.
 */
import { describe, it, expect } from 'vitest';
import { buildPrompt } from '../dag-prompts';
import type { IntentNode } from '../intent-dag';

function makeNode(action: string, content: string): IntentNode {
  return {
    id: 'n0', action: action as IntentNode['action'], content,
    entities: [], dependsOn: [], parallel: false, label: 'test',
  };
}

describe('buildPrompt', () => {
  it('builds respond prompt without context', () => {
    const result = buildPrompt(makeNode('respond', 'What is gravity?'), '');
    expect(result).toBe('What is gravity?');
  });

  it('builds respond prompt with context', () => {
    const result = buildPrompt(makeNode('respond', 'What is gravity?'), 'Prior context');
    expect(result).toContain('Prior context');
    expect(result).toContain('What is gravity?');
  });

  it('builds visualize prompt', () => {
    const result = buildPrompt(makeNode('visualize', 'orbital mechanics'), 'ctx');
    expect(result).toContain('concept diagram');
    expect(result).toContain('orbital mechanics');
    expect(result).toContain('ctx');
  });

  it('builds research prompt', () => {
    const result = buildPrompt(makeNode('research', 'harmonic series'), 'ctx');
    expect(result).toContain('Research in depth');
    expect(result).toContain('harmonic series');
  });

  it('builds define prompt', () => {
    const result = buildPrompt(makeNode('define', 'entropy'), 'ctx');
    expect(result).toContain('Define');
    expect(result).toContain('entropy');
    expect(result).toContain('etymology');
  });

  it('builds connect prompt', () => {
    const result = buildPrompt(makeNode('connect', 'gravity and orbits'), 'ctx');
    expect(result).toContain('connection');
    expect(result).toContain('gravity and orbits');
  });

  it('builds quiz prompt', () => {
    const result = buildPrompt(makeNode('quiz', 'thermodynamics'), 'ctx');
    expect(result).toContain('Socratic question');
    expect(result).toContain('thermodynamics');
  });

  it('builds summarize prompt', () => {
    const result = buildPrompt(makeNode('summarize', 'today\'s session'), 'ctx');
    expect(result).toContain('Distill');
    expect(result).toContain("today's session");
  });

  it('builds timeline prompt', () => {
    const result = buildPrompt(makeNode('timeline', 'astronomy'), 'ctx');
    expect(result).toContain('timeline');
    expect(result).toContain('astronomy');
  });

  it('builds podcast prompt', () => {
    const result = buildPrompt(makeNode('podcast', 'relativity'), 'ctx');
    expect(result).toContain('audio discussion');
    expect(result).toContain('relativity');
  });

  it('builds illustrate prompt', () => {
    const result = buildPrompt(makeNode('illustrate', 'black holes'), 'ctx');
    expect(result).toContain('sketch');
    expect(result).toContain('black holes');
  });

  it('returns content for unknown actions', () => {
    const result = buildPrompt(makeNode('silence' as IntentNode['action'], 'wait'), '');
    expect(result).toBe('wait');
  });
});
