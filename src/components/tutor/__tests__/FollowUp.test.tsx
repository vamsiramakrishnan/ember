import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('@/components/student/trigger-detect', () => ({
  detectTrigger: () => ({ type: null, query: '', position: -1 }),
  replaceTrigger: (text: string) => text,
}));
vi.mock('@/components/student/MentionPopup', () => ({
  MentionPopup: () => null,
}));
vi.mock('@/components/student/SlashCommandPopup', () => ({
  SlashCommandPopup: () => null,
}));
vi.mock('@/components/student/ChipPreviewBar', () => ({
  ChipPreviewBar: () => null,
}));
vi.mock('@/hooks/useEntityIndex', () => ({
  useEntityIndex: () => ({ search: () => [] }),
}));
vi.mock('@/primitives/MentionChip', () => ({
  createMentionSyntax: () => '@test',
}));

import { FollowUp } from '../FollowUp';

describe('FollowUp', () => {
  test('renders trigger button initially', () => {
    render(<FollowUp context="test context" onSubmit={vi.fn()} />);
    expect(screen.getByText('ask about this')).toBeInTheDocument();
  });

  test('opens input when trigger clicked', () => {
    render(<FollowUp context="test context" onSubmit={vi.fn()} />);
    fireEvent.click(screen.getByText('ask about this'));
    expect(screen.getByLabelText('Follow-up question')).toBeInTheDocument();
  });

  test('has placeholder text', () => {
    render(<FollowUp context="test context" onSubmit={vi.fn()} />);
    fireEvent.click(screen.getByText('ask about this'));
    expect(screen.getByPlaceholderText('What about this?')).toBeInTheDocument();
  });

  test('calls onSubmit with value and context on Enter', () => {
    const onSubmit = vi.fn();
    render(<FollowUp context="ctx" onSubmit={onSubmit} />);
    fireEvent.click(screen.getByText('ask about this'));
    const input = screen.getByLabelText('Follow-up question');
    fireEvent.change(input, { target: { value: 'My question' } });
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: false });
    expect(onSubmit).toHaveBeenCalledWith('My question', 'ctx');
  });

  test('closes on cancel button click', () => {
    render(<FollowUp context="ctx" onSubmit={vi.fn()} />);
    fireEvent.click(screen.getByText('ask about this'));
    fireEvent.click(screen.getByLabelText('Cancel'));
    expect(screen.getByText('ask about this')).toBeInTheDocument();
  });

  test('does not submit empty text', () => {
    const onSubmit = vi.fn();
    render(<FollowUp context="ctx" onSubmit={onSubmit} />);
    fireEvent.click(screen.getByText('ask about this'));
    const input = screen.getByLabelText('Follow-up question');
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: false });
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
