/**
 * Tests for usePopupState — @mention and /slash command popup management.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePopupState } from '../usePopupState';

vi.mock('../useEntityIndex', () => ({
  useEntityIndex: () => ({
    search: vi.fn().mockReturnValue([
      { id: 'e1', type: 'concept', name: 'Gravity', detail: 'Force' },
    ]),
    registerEntries: vi.fn(),
    entities: [],
    ready: true,
  }),
}));

vi.mock('@/contexts/StudentContext', () => ({
  useStudent: () => ({
    student: { id: 's1', displayName: 'Test' },
    notebook: { id: 'nb1', title: 'Physics' },
  }),
}));

vi.mock('@/primitives/MentionChip', () => ({
  createMentionSyntax: (name: string, type: string, id: string) => `@[${name}](${type}:${id})`,
}));

vi.mock('@/services/entity-enrichment', () => ({
  createStub: (name: string) => ({ id: 'stub-id', type: 'concept', name }),
  enrichEntity: vi.fn().mockResolvedValue(null),
}));

describe('usePopupState', () => {
  it('starts with no popups active', () => {
    const { result } = renderHook(() => usePopupState());
    expect(result.current.mentionQuery).toBeNull();
    expect(result.current.slashQuery).toBeNull();
    expect(result.current.pendingInsert).toBeNull();
  });

  it('handles mention trigger', () => {
    const { result } = renderHook(() => usePopupState());
    act(() => { result.current.handleMentionTrigger('grav'); });
    expect(result.current.mentionQuery).toBe('grav');
    expect(result.current.slashQuery).toBeNull();
  });

  it('handles slash trigger', () => {
    const { result } = renderHook(() => usePopupState());
    act(() => { result.current.handleSlashTrigger('research'); });
    expect(result.current.slashQuery).toBe('research');
    expect(result.current.mentionQuery).toBeNull();
  });

  it('closes popups', () => {
    const { result } = renderHook(() => usePopupState());
    act(() => { result.current.handleMentionTrigger('test'); });
    act(() => { result.current.handlePopupClose(); });
    expect(result.current.mentionQuery).toBeNull();
    expect(result.current.mentionResults).toEqual([]);
  });

  it('selects a mention and sets pending insert', () => {
    const { result } = renderHook(() => usePopupState());
    act(() => {
      result.current.handleMentionSelect({
        id: 'e1', type: 'concept', name: 'Gravity', detail: 'Force',
      });
    });
    expect(result.current.pendingInsert).toContain('@[Gravity]');
    expect(result.current.mentionQuery).toBeNull();
  });

  it('handles slash command selection', () => {
    const { result } = renderHook(() => usePopupState());
    const cmd = { id: 'research', label: 'Research', description: 'Research a topic' };
    act(() => { result.current.handleSlashSelect(cmd); });
    expect(result.current.pendingInsert).toBe('/Research ');
    expect(result.current.activeSlashCommand).toMatchObject({ id: 'research' });
  });

  it('consumeSlashCommand clears and returns', () => {
    const { result } = renderHook(() => usePopupState());
    const cmd = { id: 'draw', label: 'Draw', description: 'Draw' };
    act(() => { result.current.handleSlashSelect(cmd); });

    let consumed;
    act(() => { consumed = result.current.consumeSlashCommand(); });
    expect(consumed).toMatchObject({ id: 'draw' });
    expect(result.current.activeSlashCommand).toBeNull();
  });

  it('consumes pending insert', () => {
    const { result } = renderHook(() => usePopupState());
    act(() => {
      result.current.handleMentionSelect({
        id: 'e1', type: 'concept', name: 'Gravity', detail: '',
      });
    });
    expect(result.current.pendingInsert).toBeTruthy();
    act(() => { result.current.handleInsertConsumed(); });
    expect(result.current.pendingInsert).toBeNull();
  });

  it('creates mention from unknown name', () => {
    const { result } = renderHook(() => usePopupState());
    act(() => { result.current.handleMentionCreate('NewConcept'); });
    expect(result.current.pendingInsert).toContain('@[NewConcept]');
  });
});
