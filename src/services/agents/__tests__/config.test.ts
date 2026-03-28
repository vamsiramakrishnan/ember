import { describe, it, expect } from 'vitest';
import { TOOLS, MICRO_AGENT, micro } from '../config';
import type { AgentConfig, ThinkingLevel } from '../config';

describe('agents/config', () => {
  describe('TOOLS', () => {
    it('exports googleSearch tool', () => {
      expect(TOOLS.googleSearch).toHaveProperty('googleSearch');
    });

    it('exports urlContext tool', () => {
      expect(TOOLS.urlContext).toHaveProperty('urlContext');
    });

    it('exports codeExecution tool', () => {
      expect(TOOLS.codeExecution).toHaveProperty('codeExecution');
    });
  });

  describe('MICRO_AGENT', () => {
    it('has correct name', () => {
      expect(MICRO_AGENT.name).toBe('MicroTask');
    });

    it('uses MINIMAL thinking', () => {
      expect(MICRO_AGENT.thinkingLevel).toBe('MINIMAL');
    });

    it('has no tools', () => {
      expect(MICRO_AGENT.tools).toEqual([]);
    });

    it('has TEXT response modality', () => {
      expect(MICRO_AGENT.responseModalities).toEqual(['TEXT']);
    });

    it('has empty system instruction', () => {
      expect(MICRO_AGENT.systemInstruction).toBe('');
    });
  });

  describe('micro', () => {
    it('creates agent with custom instruction', () => {
      const agent = micro('Custom instruction');
      expect(agent.systemInstruction).toBe('Custom instruction');
      expect(agent.name).toBe('MicroTask');
    });

    it('creates agent with optional schema', () => {
      const mockSchema = { _type: 'ZodObject' };
      const agent = micro('instruction', mockSchema as never);
      expect(agent.responseSchema).toBe(mockSchema);
    });

    it('inherits MICRO_AGENT defaults', () => {
      const agent = micro('test');
      expect(agent.model).toBe(MICRO_AGENT.model);
      expect(agent.thinkingLevel).toBe('MINIMAL');
      expect(agent.tools).toEqual([]);
    });

    it('does not mutate MICRO_AGENT', () => {
      micro('modified');
      expect(MICRO_AGENT.systemInstruction).toBe('');
    });
  });

  describe('ThinkingLevel type coverage', () => {
    it('supports all thinking levels', () => {
      const levels: ThinkingLevel[] = ['MINIMAL', 'LOW', 'MEDIUM', 'HIGH'];
      expect(levels).toHaveLength(4);
    });
  });

  describe('AgentConfig shape', () => {
    it('has correct required fields', () => {
      const agent: AgentConfig = {
        name: 'Test',
        model: 'test-model',
        systemInstruction: 'test',
        thinkingLevel: 'LOW',
        tools: [],
        responseModalities: ['TEXT'],
      };
      expect(agent.name).toBe('Test');
      expect(agent.maxTurns).toBeUndefined();
      expect(agent.constraint).toBeUndefined();
    });
  });
});
