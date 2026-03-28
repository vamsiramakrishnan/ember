import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('../trigger-detect', () => ({
  detectTrigger: () => ({ type: null, query: '', position: -1 }),
  replaceTrigger: (text: string) => text,
}));
vi.mock('../ChipPreviewBar', () => ({
  ChipPreviewBar: () => null,
}));

import { InlineEditor } from '../InlineEditor';

describe('InlineEditor', () => {
  const defaultProps = {
    initialContent: 'Initial text',
    entryType: 'prose',
    onSave: vi.fn(),
    onCancel: vi.fn(),
  };

  test('renders a textarea with initial content', () => {
    render(<InlineEditor {...defaultProps} />);
    const textarea = screen.getByLabelText('Edit entry') as HTMLTextAreaElement;
    expect(textarea.value).toBe('Initial text');
  });

  test('calls onSave when Enter pressed', () => {
    const onSave = vi.fn();
    render(<InlineEditor {...defaultProps} onSave={onSave} />);
    const textarea = screen.getByLabelText('Edit entry');
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });
    expect(onSave).toHaveBeenCalledWith('Initial text');
  });

  test('calls onCancel when Escape pressed', () => {
    const onCancel = vi.fn();
    render(<InlineEditor {...defaultProps} onCancel={onCancel} />);
    const textarea = screen.getByLabelText('Edit entry');
    fireEvent.keyDown(textarea, { key: 'Escape' });
    expect(onCancel).toHaveBeenCalled();
  });

  test('updates value on change', () => {
    render(<InlineEditor {...defaultProps} />);
    const textarea = screen.getByLabelText('Edit entry') as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: 'Updated text' } });
    expect(textarea.value).toBe('Updated text');
  });

  test('has placeholder text', () => {
    render(<InlineEditor {...defaultProps} />);
    const textarea = screen.getByLabelText('Edit entry');
    expect(textarea).toHaveAttribute('placeholder', 'Continue your thought…');
  });
});
