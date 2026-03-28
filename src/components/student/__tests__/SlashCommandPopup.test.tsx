import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('../slash-commands', () => ({
  COMMANDS: [
    { id: 'explain', label: 'explain', hint: 'unpack a concept', icon: '◇', accent: '', group: 'explore' },
    { id: 'draw', label: 'draw', hint: 'sketch a concept', icon: '✎', accent: '', group: 'create' },
  ],
  GROUP_LABELS: { explore: 'explore', create: 'create' },
}));

import { SlashCommandPopup } from '../SlashCommandPopup';

describe('SlashCommandPopup', () => {
  const defaultProps = {
    query: '',
    onSelect: vi.fn(),
    onClose: vi.fn(),
  };

  test('renders all commands when query is empty', () => {
    render(<SlashCommandPopup {...defaultProps} />);
    expect(screen.getByText('/explain')).toBeInTheDocument();
    expect(screen.getByText('/draw')).toBeInTheDocument();
  });

  test('filters commands by query', () => {
    render(<SlashCommandPopup {...defaultProps} query="expl" />);
    expect(screen.getByText('/explain')).toBeInTheDocument();
    expect(screen.queryByText('/draw')).not.toBeInTheDocument();
  });

  test('shows no commands match when query has no results', () => {
    render(<SlashCommandPopup {...defaultProps} query="zzzzz" />);
    expect(screen.getByText('no commands match')).toBeInTheDocument();
  });

  test('has listbox role', () => {
    render(<SlashCommandPopup {...defaultProps} />);
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  test('renders group headers when no query', () => {
    render(<SlashCommandPopup {...defaultProps} />);
    expect(screen.getByText('explore')).toBeInTheDocument();
    expect(screen.getByText('create')).toBeInTheDocument();
  });

  test('shows navigation hints in footer', () => {
    render(<SlashCommandPopup {...defaultProps} />);
    expect(screen.getByText('↑↓ navigate')).toBeInTheDocument();
    expect(screen.getByText('↵ select')).toBeInTheDocument();
  });

  test('calls onSelect when command is clicked', () => {
    const onSelect = vi.fn();
    render(<SlashCommandPopup {...defaultProps} onSelect={onSelect} />);
    screen.getByText('/explain').closest('button')?.click();
    expect(onSelect).toHaveBeenCalled();
  });
});
