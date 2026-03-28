import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('@/services/reading-material-export', () => ({
  exportToPptx: vi.fn(() => Promise.resolve()),
}));
vi.mock('@/services/docx-export', () => ({
  exportToDocx: vi.fn(() => Promise.resolve()),
}));
vi.mock('@/services/deck-expander', () => ({
  expandDeck: vi.fn(() => Promise.resolve(null)),
}));
vi.mock('@/services/slide-enrichment', () => ({
  enrichSlideVisuals: vi.fn(() => Promise.resolve()),
}));

import { DeckToolbar } from '../DeckToolbar';

describe('DeckToolbar', () => {
  const defaultProps = {
    title: 'Lecture',
    slides: [{ heading: 'Slide 1', body: 'Content', layout: 'content' as const }],
    onOpenModal: vi.fn(),
    onCollapse: vi.fn(),
  };

  test('renders export buttons', () => {
    render(<DeckToolbar {...defaultProps} />);
    expect(screen.getByLabelText('Download as PPTX')).toBeInTheDocument();
    expect(screen.getByLabelText('Download as DOCX')).toBeInTheDocument();
  });

  test('renders view control buttons', () => {
    render(<DeckToolbar {...defaultProps} />);
    expect(screen.getByLabelText('Open full view')).toBeInTheDocument();
    expect(screen.getByLabelText('Collapse')).toBeInTheDocument();
  });

  test('calls onOpenModal when full view clicked', () => {
    const onOpenModal = vi.fn();
    render(<DeckToolbar {...defaultProps} onOpenModal={onOpenModal} />);
    fireEvent.click(screen.getByLabelText('Open full view'));
    expect(onOpenModal).toHaveBeenCalled();
  });

  test('calls onCollapse when collapse clicked', () => {
    const onCollapse = vi.fn();
    render(<DeckToolbar {...defaultProps} onCollapse={onCollapse} />);
    fireEvent.click(screen.getByLabelText('Collapse'));
    expect(onCollapse).toHaveBeenCalled();
  });

  test('shows expand buttons when onPatch provided', () => {
    render(<DeckToolbar {...defaultProps} onPatch={vi.fn()} />);
    expect(screen.getByLabelText('Add 3 slides')).toBeInTheDocument();
    expect(screen.getByLabelText('Add 5 slides')).toBeInTheDocument();
  });

  test('does not show expand buttons when onPatch not provided', () => {
    render(<DeckToolbar {...defaultProps} />);
    expect(screen.queryByLabelText('Add 3 slides')).not.toBeInTheDocument();
  });
});
