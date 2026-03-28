import { describe, test, expect, vi } from 'vitest';

vi.mock('../MentionPopup.module.css', () => ({ default: {} }));

import { COMMANDS, GROUP_LABELS, SLASH_COMMAND_PATTERN } from '../slash-commands';

describe('slash-commands', () => {
  test('COMMANDS is a non-empty array', () => {
    expect(COMMANDS.length).toBeGreaterThan(0);
  });

  test('every command has required fields', () => {
    for (const cmd of COMMANDS) {
      expect(cmd.id).toBeTruthy();
      expect(cmd.label).toBeTruthy();
      expect(cmd.hint).toBeTruthy();
      expect(cmd.icon).toBeTruthy();
      expect(cmd.group).toBeTruthy();
    }
  });

  test('commands have unique ids', () => {
    const ids = COMMANDS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('GROUP_LABELS covers all groups', () => {
    const groups = new Set(COMMANDS.map((c) => c.group));
    for (const g of groups) {
      expect(GROUP_LABELS[g]).toBeTruthy();
    }
  });

  test('SLASH_COMMAND_PATTERN contains all command ids', () => {
    for (const cmd of COMMANDS) {
      expect(SLASH_COMMAND_PATTERN).toContain(cmd.id);
    }
  });

  test('SLASH_COMMAND_PATTERN is pipe-separated', () => {
    expect(SLASH_COMMAND_PATTERN).toContain('|');
    const parts = SLASH_COMMAND_PATTERN.split('|');
    expect(parts.length).toBe(COMMANDS.length);
  });
});
