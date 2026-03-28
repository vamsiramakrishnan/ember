import { describe, it, expect } from 'vitest';
import { AGENT_TOOL_DECLARATIONS } from '../agent-tools';

describe('agent-tools', () => {
  const declarations = AGENT_TOOL_DECLARATIONS[0]!.functionDeclarations;

  it('exports a non-empty array of tool declarations', () => {
    expect(AGENT_TOOL_DECLARATIONS).toHaveLength(1);
    expect(declarations.length).toBeGreaterThan(0);
  });

  it('contains search_history tool', () => {
    const tool = declarations.find((d) => d.name === 'search_history');
    expect(tool).toBeDefined();
    expect(tool?.parameters?.properties).toHaveProperty('query');
    expect(tool?.parameters?.properties).toHaveProperty('scope');
  });

  it('contains lookup_concept tool with required concept param', () => {
    const tool = declarations.find((d) => d.name === 'lookup_concept');
    expect(tool).toBeDefined();
    expect(tool?.parameters?.required).toContain('concept');
  });

  it('contains lookup_thinker tool', () => {
    const tool = declarations.find((d) => d.name === 'lookup_thinker');
    expect(tool).toBeDefined();
    expect(tool?.parameters?.required).toContain('thinker');
  });

  it('contains lookup_term tool', () => {
    const tool = declarations.find((d) => d.name === 'lookup_term');
    expect(tool).toBeDefined();
    expect(tool?.parameters?.required).toContain('term');
  });

  it('contains get_connections tool with entity param', () => {
    const tool = declarations.find((d) => d.name === 'get_connections');
    expect(tool).toBeDefined();
    expect(tool?.parameters?.required).toContain('entity');
  });

  it('contains get_recent_changes tool', () => {
    const tool = declarations.find((d) => d.name === 'get_recent_changes');
    expect(tool).toBeDefined();
  });

  it('contains create_annotation tool with required entry_id and content', () => {
    const tool = declarations.find((d) => d.name === 'create_annotation');
    expect(tool).toBeDefined();
    expect(tool?.parameters?.required).toContain('entry_id');
    expect(tool?.parameters?.required).toContain('content');
  });

  it('contains add_to_lexicon tool', () => {
    const tool = declarations.find((d) => d.name === 'add_to_lexicon');
    expect(tool).toBeDefined();
    expect(tool?.parameters?.required).toContain('term');
    expect(tool?.parameters?.required).toContain('definition');
  });

  it('contains get_entry_content tool', () => {
    const tool = declarations.find((d) => d.name === 'get_entry_content');
    expect(tool).toBeDefined();
    expect(tool?.parameters?.required).toContain('entry_id');
  });

  it('contains read_file_content tool', () => {
    const tool = declarations.find((d) => d.name === 'read_file_content');
    expect(tool).toBeDefined();
    expect(tool?.parameters?.required).toContain('entry_id');
  });

  it('all tools have name, description, and parameters', () => {
    for (const tool of declarations) {
      expect(tool.name).toBeTruthy();
      expect(tool.description).toBeTruthy();
      expect(tool.parameters).toBeDefined();
    }
  });
});
