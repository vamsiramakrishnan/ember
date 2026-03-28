import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('@/primitives/MarkdownContent', () => ({
  MarkdownContent: ({ children }: { children: string }) => <span>{children}</span>,
}));

import { Directive } from '../Directive';

describe('Directive', () => {
  test('renders content text', () => {
    render(<Directive>Read chapter 3 of Principia</Directive>);
    expect(screen.getByText('Read chapter 3 of Principia')).toBeInTheDocument();
  });

  test('renders action label when provided', () => {
    render(<Directive action="read">Read this</Directive>);
    expect(screen.getByText('read')).toBeInTheDocument();
  });

  test('shows mark complete button when onComplete provided', () => {
    render(<Directive onComplete={vi.fn()}>Do something</Directive>);
    expect(screen.getByLabelText('Mark directive as complete')).toBeInTheDocument();
  });

  test('does not show mark complete when already completed', () => {
    render(<Directive completed>Already done</Directive>);
    expect(screen.queryByLabelText('Mark directive as complete')).not.toBeInTheDocument();
  });

  test('calls onComplete when mark complete clicked', () => {
    const onComplete = vi.fn();
    render(<Directive onComplete={onComplete}>Task</Directive>);
    fireEvent.click(screen.getByLabelText('Mark directive as complete'));
    expect(onComplete).toHaveBeenCalled();
  });

  test('shows checkmark after completing', () => {
    const onComplete = vi.fn();
    render(<Directive onComplete={onComplete}>Task</Directive>);
    fireEvent.click(screen.getByLabelText('Mark directive as complete'));
    expect(screen.getByLabelText('Completed')).toBeInTheDocument();
  });

  test('shows completed date when completedAt provided', () => {
    render(
      <Directive completed completedAt={new Date('2025-03-15').getTime()}>
        Done task
      </Directive>,
    );
    expect(screen.getByText(/done/)).toBeInTheDocument();
    expect(screen.getByText(/Mar 15/)).toBeInTheDocument();
  });

  test('does not call onComplete when already completed', () => {
    const onComplete = vi.fn();
    render(<Directive completed onComplete={onComplete}>Task</Directive>);
    // No button to click since it's already completed
    expect(screen.queryByLabelText('Mark directive as complete')).not.toBeInTheDocument();
  });
});
