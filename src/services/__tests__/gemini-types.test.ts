/**
 * Tests for gemini-types — verifies type exports and interfaces.
 * Since this is a type-only file, we verify that the types are
 * structurally correct by constructing values conforming to them.
 */
import { describe, test, expect } from 'vitest';
import type { GeminiMessage, GeminiPart, EmberToolConfig } from '../gemini-types';

describe('gemini-types', () => {
  test('GeminiMessage conforms to expected shape', () => {
    const msg: GeminiMessage = {
      role: 'user',
      parts: [{ text: 'hello' }],
    };
    expect(msg.role).toBe('user');
    expect(msg.parts[0]?.text).toBe('hello');
  });

  test('GeminiMessage accepts model role', () => {
    const msg: GeminiMessage = {
      role: 'model',
      parts: [{ text: 'response' }],
    };
    expect(msg.role).toBe('model');
  });

  test('GeminiPart supports inlineData', () => {
    const part: GeminiPart = {
      inlineData: { mimeType: 'image/png', data: 'base64data' },
    };
    expect(part.inlineData?.mimeType).toBe('image/png');
  });

  test('GeminiPart supports functionCall', () => {
    const part: GeminiPart = {
      functionCall: { name: 'search', args: { query: 'test' } },
    };
    expect(part.functionCall?.name).toBe('search');
  });

  test('GeminiPart supports functionResponse', () => {
    const part: GeminiPart = {
      functionResponse: { name: 'search', response: { result: 'found' } },
    };
    expect(part.functionResponse?.response.result).toBe('found');
  });

  test('EmberToolConfig type is usable', () => {
    // EmberToolConfig is a type alias for Tool — just verify it's importable
    const tool: EmberToolConfig = { googleSearch: {} };
    expect(tool).toBeDefined();
  });
});
