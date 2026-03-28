import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('@/primitives/MarkdownContent', () => ({
  MarkdownContent: ({ children }: { children: string }) => <span>{children}</span>,
}));

import { AnnotationMargin } from '../AnnotationMargin';
import type { EntryAnnotation } from '@/types/entries';

const annotations: EntryAnnotation[] = [
  { id: 'a1', author: 'student', content: 'My note', timestamp: 1000 },
  { id: 'a2', author: 'tutor', content: 'Good point', timestamp: 2000 },
];

describe('AnnotationMargin', () => {
  test('shows count indicator when annotations exist', () => {
    render(<AnnotationMargin annotations={annotations} onAdd={vi.fn()} />);
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  test('shows add button', () => {
    render(<AnnotationMargin annotations={[]} onAdd={vi.fn()} />);
    expect(screen.getByLabelText('Add annotation')).toBeInTheDocument();
  });

  test('expands to show all annotations on indicator click', () => {
    render(<AnnotationMargin annotations={annotations} onAdd={vi.fn()} />);
    fireEvent.click(screen.getByLabelText(/click to expand/));
    expect(screen.getByText('My note')).toBeInTheDocument();
    expect(screen.getByText('Good point')).toBeInTheDocument();
  });

  test('shows compose textarea when add button clicked from collapsed', () => {
    render(<AnnotationMargin annotations={[]} onAdd={vi.fn()} />);
    fireEvent.click(screen.getByLabelText('Add annotation'));
    expect(screen.getByPlaceholderText('annotate...')).toBeInTheDocument();
  });

  test('calls onAdd when annotation submitted', () => {
    const onAdd = vi.fn();
    render(<AnnotationMargin annotations={[]} onAdd={onAdd} />);
    fireEvent.click(screen.getByLabelText('Add annotation'));
    const textarea = screen.getByPlaceholderText('annotate...');
    fireEvent.change(textarea, { target: { value: 'New note' } });
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });
    expect(onAdd).toHaveBeenCalledWith('New note');
  });

  test('does not submit empty annotations', () => {
    const onAdd = vi.fn();
    render(<AnnotationMargin annotations={[]} onAdd={onAdd} />);
    fireEvent.click(screen.getByLabelText('Add annotation'));
    const textarea = screen.getByPlaceholderText('annotate...');
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });
    expect(onAdd).not.toHaveBeenCalled();
  });

  test('shows collapse button when expanded', () => {
    render(<AnnotationMargin annotations={annotations} onAdd={vi.fn()} />);
    fireEvent.click(screen.getByLabelText(/click to expand/));
    expect(screen.getByLabelText('Collapse annotations')).toBeInTheDocument();
  });
});
