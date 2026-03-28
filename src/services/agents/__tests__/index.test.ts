import { describe, it, expect } from 'vitest';
import {
  AGENTS,
  TUTOR_AGENT,
  RESEARCHER_AGENT,
  VISUALISER_AGENT,
  ILLUSTRATOR_AGENT,
  READER_AGENT,
  BOOTSTRAP_AGENT,
  ECHO_AGENT,
  REFLECTION_AGENT,
  ANNOTATOR_AGENT,
  CRITIC_AGENT,
  IMAGE_CRITIC_AGENT,
  CONTENT_CRITIC_AGENT,
  TOOLS,
  MICRO_AGENT,
  micro,
} from '../index';
import type { AgentConfig, AgentName } from '../index';

describe('agents/index', () => {
  it('exports AGENTS registry with all 12 agents', () => {
    const names = Object.keys(AGENTS);
    expect(names).toHaveLength(12);
    expect(names).toContain('tutor');
    expect(names).toContain('researcher');
    expect(names).toContain('visualiser');
    expect(names).toContain('illustrator');
    expect(names).toContain('reader');
    expect(names).toContain('bootstrap');
    expect(names).toContain('echo');
    expect(names).toContain('reflection');
    expect(names).toContain('annotator');
    expect(names).toContain('critic');
    expect(names).toContain('imageCritic');
    expect(names).toContain('contentCritic');
  });

  it('all AGENTS entries are valid AgentConfig objects', () => {
    for (const [, agent] of Object.entries(AGENTS)) {
      const config = agent as AgentConfig;
      expect(config.name).toBeTruthy();
      expect(config.model).toBeTruthy();
      expect(config.systemInstruction).toBeTruthy();
      expect(config.thinkingLevel).toBeTruthy();
      expect(Array.isArray(config.tools)).toBe(true);
      expect(Array.isArray(config.responseModalities)).toBe(true);
    }
  });

  it('re-exports individual agent configs', () => {
    expect(TUTOR_AGENT).toBe(AGENTS.tutor);
    expect(RESEARCHER_AGENT).toBe(AGENTS.researcher);
    expect(VISUALISER_AGENT).toBe(AGENTS.visualiser);
    expect(ILLUSTRATOR_AGENT).toBe(AGENTS.illustrator);
    expect(READER_AGENT).toBe(AGENTS.reader);
    expect(BOOTSTRAP_AGENT).toBe(AGENTS.bootstrap);
    expect(ECHO_AGENT).toBe(AGENTS.echo);
    expect(REFLECTION_AGENT).toBe(AGENTS.reflection);
    expect(ANNOTATOR_AGENT).toBe(AGENTS.annotator);
    expect(CRITIC_AGENT).toBe(AGENTS.critic);
    expect(IMAGE_CRITIC_AGENT).toBe(AGENTS.imageCritic);
    expect(CONTENT_CRITIC_AGENT).toBe(AGENTS.contentCritic);
  });

  it('re-exports config utilities', () => {
    expect(TOOLS).toBeDefined();
    expect(MICRO_AGENT).toBeDefined();
    expect(typeof micro).toBe('function');
  });

  it('AgentName type covers all keys', () => {
    const names: AgentName[] = [
      'tutor', 'researcher', 'visualiser', 'illustrator',
      'reader', 'bootstrap', 'echo', 'reflection',
      'annotator', 'critic', 'imageCritic', 'contentCritic',
    ];
    expect(names).toHaveLength(12);
    // Each name should be a valid key in AGENTS
    for (const name of names) {
      expect(AGENTS[name]).toBeDefined();
    }
  });
});
