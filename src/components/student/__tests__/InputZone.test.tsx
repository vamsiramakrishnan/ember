import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';

// Mock the heavy dependencies InputZone pulls in
vi.mock('@/hooks/useEntryInference', () => ({
  inferEntryType: () => null,
}));
vi.mock('@/components/student/trigger-detect', () => ({
  detectTrigger: () => ({ type: 'none' }),
  replaceTrigger: (text: string) => text,
}));
vi.mock('@/components/student/SketchInput', () => ({
  SketchInput: () => <div data-testid="sketch-input" />,
}));
vi.mock('@/components/student/BlockInserter', () => ({
  BlockInserter: () => <div data-testid="block-inserter" />,
}));
vi.mock('@/components/student/InputAffordances', () => ({
  InputAffordances: () => null,
}));
vi.mock('@/components/student/ChipPreviewBar', () => ({
  ChipPreviewBar: () => null,
}));
vi.mock('@/primitives/MathPreview', () => ({
  MathPreview: () => null,
}));

import { InputZone } from '../InputZone';

describe('InputZone', () => {
  test('renders a textarea', () => {
    render(<InputZone />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  test('textarea has an accessible label', () => {
    render(<InputZone />);
    expect(
      screen.getByLabelText('Write your thoughts'),
    ).toBeInTheDocument();
  });

  test('shows placeholder hint when empty and unfocused', () => {
    render(<InputZone />);
    expect(
      screen.getByText('What are you thinking about?'),
    ).toBeInTheDocument();
  });

  test('calls onSubmit when Enter is pressed with text', () => {
    const onSubmit = vi.fn();
    render(<InputZone onSubmit={onSubmit} />);
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'Hello world' } });
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });
    expect(onSubmit).toHaveBeenCalledWith('Hello world');
  });

  test('clears input after submission', async () => {
    vi.useFakeTimers();
    const onSubmit = vi.fn();
    render(<InputZone onSubmit={onSubmit} />);
    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: 'Hello world' } });
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });
    // InputZone uses a 200ms morph delay before clearing
    act(() => { vi.advanceTimersByTime(250); });
    expect(textarea.value).toBe('');
    vi.useRealTimers();
  });
});
