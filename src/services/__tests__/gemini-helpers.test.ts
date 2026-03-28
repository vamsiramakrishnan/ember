/**
 * Tests for gemini-helpers — tool array building, config building,
 * and stream processing utilities.
 */
import { describe, test, expect, vi } from 'vitest';
import {
  buildToolsArray,
  buildConfig,
  collectStreamChunks,
  streamWithCallback,
} from '../gemini-helpers';

describe('buildToolsArray', () => {
  test('returns empty array when no options', () => {
    expect(buildToolsArray()).toEqual([]);
    expect(buildToolsArray({})).toEqual([]);
  });

  test('includes googleSearch when useSearch is true', () => {
    const tools = buildToolsArray({ useSearch: true });
    expect(tools).toEqual([{ googleSearch: {} }]);
  });

  test('includes urlContext when useUrlContext is true', () => {
    const tools = buildToolsArray({ useUrlContext: true });
    expect(tools).toEqual([{ urlContext: {} }]);
  });

  test('includes codeExecution when useCodeExecution is true', () => {
    const tools = buildToolsArray({ useCodeExecution: true });
    expect(tools).toEqual([{ codeExecution: {} }]);
  });

  test('includes multiple tools when multiple flags are true', () => {
    const tools = buildToolsArray({
      useSearch: true,
      useUrlContext: true,
      useCodeExecution: true,
    });
    expect(tools).toHaveLength(3);
  });

  test('excludes tools for false flags', () => {
    const tools = buildToolsArray({
      useSearch: false,
      useUrlContext: false,
      useCodeExecution: false,
    });
    expect(tools).toEqual([]);
  });
});

describe('buildConfig', () => {
  test('returns empty config when no options', () => {
    expect(buildConfig()).toEqual({});
  });

  test('does not include tools when array is empty', () => {
    const config = buildConfig({}, []);
    expect(config.tools).toBeUndefined();
  });

  test('includes tools when array is non-empty', () => {
    const tools = [{ googleSearch: {} }];
    const config = buildConfig({}, tools);
    expect(config.tools).toEqual(tools);
  });

  test('includes systemInstruction when provided', () => {
    const config = buildConfig({ systemInstruction: 'Be helpful' });
    expect(config.systemInstruction).toBe('Be helpful');
  });

  test('omits systemInstruction when not provided', () => {
    const config = buildConfig({});
    expect(config.systemInstruction).toBeUndefined();
  });
});

describe('collectStreamChunks', () => {
  test('collects text from multiple chunks', async () => {
    const chunks = [
      { candidates: [{ content: { parts: [{ text: 'Hello ' }] } }] },
      { candidates: [{ content: { parts: [{ text: 'world' }] } }] },
    ];
    async function* gen() { for (const c of chunks) yield c; }
    const result = await collectStreamChunks(gen() as ReturnType<typeof gen>);
    expect(result).toBe('Hello world');
  });

  test('skips chunks without candidates', async () => {
    const chunks = [
      { candidates: [{ content: { parts: [{ text: 'ok' }] } }] },
      { candidates: undefined },
      { candidates: [{ content: { parts: [{ text: '!' }] } }] },
    ];
    async function* gen() { for (const c of chunks) yield c; }
    const result = await collectStreamChunks(gen() as ReturnType<typeof gen>);
    expect(result).toBe('ok!');
  });

  test('skips parts without text', async () => {
    const chunks = [
      { candidates: [{ content: { parts: [{ text: undefined }] } }] },
      { candidates: [{ content: { parts: [{ text: 'data' }] } }] },
    ];
    async function* gen() { for (const c of chunks) yield c; }
    const result = await collectStreamChunks(gen() as ReturnType<typeof gen>);
    expect(result).toBe('data');
  });

  test('returns empty string for empty stream', async () => {
    async function* gen() { /* empty */ }
    const result = await collectStreamChunks(gen() as ReturnType<typeof gen>);
    expect(result).toBe('');
  });
});

describe('streamWithCallback', () => {
  test('calls onChunk with each piece and accumulated text', async () => {
    const chunks = [
      { candidates: [{ content: { parts: [{ text: 'A' }] } }] },
      { candidates: [{ content: { parts: [{ text: 'B' }] } }] },
    ];
    async function* gen() { for (const c of chunks) yield c; }
    const onChunk = vi.fn();
    const result = await streamWithCallback(gen() as ReturnType<typeof gen>, onChunk);
    expect(result).toBe('AB');
    expect(onChunk).toHaveBeenCalledTimes(2);
    expect(onChunk).toHaveBeenCalledWith('A', 'A');
    expect(onChunk).toHaveBeenCalledWith('B', 'AB');
  });

  test('returns empty string when stream has no text', async () => {
    async function* gen() { /* empty */ }
    const onChunk = vi.fn();
    const result = await streamWithCallback(gen() as ReturnType<typeof gen>, onChunk);
    expect(result).toBe('');
    expect(onChunk).not.toHaveBeenCalled();
  });
});
