import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('@/primitives/ContextPanel', () => ({
  ContextPanel: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock('../BlockMenu', () => ({
  BlockMenu: ({ onTextSelect }: { onTextSelect: (t: string) => void }) => (
    <button onClick={() => onTextSelect('prose')}>mock-prose</button>
  ),
}));

import { BlockInserter } from '../BlockInserter';

describe('BlockInserter', () => {
  test('renders the trigger button', () => {
    render(<BlockInserter onSelect={vi.fn()} />);
    expect(screen.getByLabelText('Insert a new block')).toBeInTheDocument();
  });

  test('shows menu when trigger is clicked', () => {
    render(<BlockInserter onSelect={vi.fn()} />);
    fireEvent.click(screen.getByLabelText('Insert a new block'));
    expect(screen.getByText('mock-prose')).toBeInTheDocument();
  });

  test('calls onSelect and closes menu when block type selected', () => {
    const onSelect = vi.fn();
    render(<BlockInserter onSelect={onSelect} />);
    fireEvent.click(screen.getByLabelText('Insert a new block'));
    fireEvent.click(screen.getByText('mock-prose'));
    expect(onSelect).toHaveBeenCalledWith('prose');
    expect(screen.queryByText('mock-prose')).not.toBeInTheDocument();
  });

  test('toggles menu closed on second click', () => {
    render(<BlockInserter onSelect={vi.fn()} />);
    const trigger = screen.getByLabelText('Insert a new block');
    fireEvent.click(trigger);
    expect(screen.getByText('mock-prose')).toBeInTheDocument();
    fireEvent.click(trigger);
    expect(screen.queryByText('mock-prose')).not.toBeInTheDocument();
  });

  test('has aria-expanded attribute', () => {
    render(<BlockInserter onSelect={vi.fn()} />);
    const trigger = screen.getByLabelText('Insert a new block');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });
});
