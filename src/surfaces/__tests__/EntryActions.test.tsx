import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('../NotebookEntryWrapper.module.css', () => ({ default: {} }));

import { EntryActions } from '../EntryActions';

describe('EntryActions', () => {
  const baseProps = {
    id: 'e1',
    canCrossOut: true,
    crossedOut: false,
    bookmarked: false,
    canPin: true,
    pinned: false,
    onCrossOut: vi.fn(),
    onToggleBookmark: vi.fn(),
    onTogglePin: vi.fn(),
  };

  test('renders action group', () => {
    render(<EntryActions {...baseProps} />);
    expect(screen.getByRole('group', { name: 'Entry actions' })).toBeInTheDocument();
  });

  test('renders cross out button when canCrossOut', () => {
    render(<EntryActions {...baseProps} />);
    expect(screen.getByLabelText('Cross out')).toBeInTheDocument();
  });

  test('renders restore label when crossedOut', () => {
    render(<EntryActions {...baseProps} crossedOut={true} />);
    expect(screen.getByLabelText('Restore')).toBeInTheDocument();
  });

  test('fires onCrossOut callback', () => {
    const onCrossOut = vi.fn();
    render(<EntryActions {...baseProps} onCrossOut={onCrossOut} />);
    fireEvent.click(screen.getByLabelText('Cross out'));
    expect(onCrossOut).toHaveBeenCalledTimes(1);
  });

  test('renders bookmark button', () => {
    render(<EntryActions {...baseProps} />);
    expect(screen.getByLabelText('Bookmark')).toBeInTheDocument();
  });

  test('fires onToggleBookmark', () => {
    const fn = vi.fn();
    render(<EntryActions {...baseProps} onToggleBookmark={fn} />);
    fireEvent.click(screen.getByLabelText('Bookmark'));
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test('renders pin button when canPin', () => {
    render(<EntryActions {...baseProps} />);
    expect(screen.getByLabelText('Pin')).toBeInTheDocument();
  });

  test('does not render pin button when canPin is false', () => {
    render(<EntryActions {...baseProps} canPin={false} />);
    expect(screen.queryByLabelText('Pin')).not.toBeInTheDocument();
  });

  test('renders edit button when canEdit', () => {
    render(<EntryActions {...baseProps} canEdit={true} onEdit={vi.fn()} />);
    expect(screen.getByLabelText('Edit')).toBeInTheDocument();
  });

  test('renders branch button when onBranch provided', () => {
    render(<EntryActions {...baseProps} onBranch={vi.fn()} />);
    expect(screen.getByLabelText('Branch into new notebook')).toBeInTheDocument();
  });
});
