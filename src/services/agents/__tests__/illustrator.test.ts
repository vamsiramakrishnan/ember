import { describe, it, expect } from 'vitest';
import { ILLUSTRATOR_AGENT } from '../illustrator';

describe('agents/illustrator', () => {
  it('has correct name', () => {
    expect(ILLUSTRATOR_AGENT.name).toBe('Illustrator');
  });

  it('uses image model', () => {
    expect(ILLUSTRATOR_AGENT.model).toContain('image');
  });

  it('uses MINIMAL thinking', () => {
    expect(ILLUSTRATOR_AGENT.thinkingLevel).toBe('MINIMAL');
  });

  it('includes Google Search tool', () => {
    expect(ILLUSTRATOR_AGENT.tools).toHaveLength(1);
    expect(ILLUSTRATOR_AGENT.tools[0]).toHaveProperty('googleSearch');
  });

  it('has IMAGE and TEXT response modalities', () => {
    expect(ILLUSTRATOR_AGENT.responseModalities).toContain('IMAGE');
    expect(ILLUSTRATOR_AGENT.responseModalities).toContain('TEXT');
  });

  it('has max turns of 3', () => {
    expect(ILLUSTRATOR_AGENT.maxTurns).toBe(3);
  });

  it('has 30s time limit', () => {
    expect(ILLUSTRATOR_AGENT.maxTimeMs).toBe(30_000);
  });

  it('instruction describes warm ivory paper aesthetic', () => {
    expect(ILLUSTRATOR_AGENT.systemInstruction).toContain('#FAF6F1');
    expect(ILLUSTRATOR_AGENT.systemInstruction).toContain('#2C2825');
  });

  it('instruction describes three drawing modes', () => {
    expect(ILLUSTRATOR_AGENT.systemInstruction).toContain('concept sketch');
    expect(ILLUSTRATOR_AGENT.systemInstruction).toContain('abstract icon');
    expect(ILLUSTRATOR_AGENT.systemInstruction).toContain('infographic');
  });
});
