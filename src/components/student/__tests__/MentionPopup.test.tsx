import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// jsdom doesn't have scrollIntoView
Element.prototype.scrollIntoView = vi.fn();

import { MentionPopup } from '../MentionPopup';

const mockEntity = {
  id: 'e1',
  name: 'Kepler',
  type: 'thinker' as const,
  detail: 'Astronomer',
};

describe('MentionPopup', () => {
  const defaultProps = {
    query: '',
    results: [mockEntity],
    onSelect: vi.fn(),
    onClose: vi.fn(),
  };

  test('renders entity results', () => {
    render(<MentionPopup {...defaultProps} />);
    expect(screen.getByText('Kepler')).toBeInTheDocument();
  });

  test('shows entity detail', () => {
    render(<MentionPopup {...defaultProps} />);
    expect(screen.getByText('Astronomer')).toBeInTheDocument();
  });

  test('returns null when no results and no query', () => {
    const { container } = render(
      <MentionPopup {...defaultProps} results={[]} query="" />,
    );
    expect(container.firstChild).toBeNull();
  });

  test('shows no matches when query provided but no results', () => {
    render(
      <MentionPopup {...defaultProps} results={[]} query="xyz" />,
    );
    expect(screen.getByText('no matches')).toBeInTheDocument();
  });

  test('shows create row when onCreate provided and query >= 2 chars', () => {
    render(
      <MentionPopup
        {...defaultProps}
        query="Ne"
        onCreate={vi.fn()}
      />,
    );
    expect(screen.getByText(/Create/)).toBeInTheDocument();
  });

  test('does not show create row when query too short', () => {
    render(
      <MentionPopup
        {...defaultProps}
        query="N"
        onCreate={vi.fn()}
      />,
    );
    expect(screen.queryByText(/Create/)).not.toBeInTheDocument();
  });

  test('calls onSelect when entity clicked', () => {
    const onSelect = vi.fn();
    render(<MentionPopup {...defaultProps} onSelect={onSelect} />);
    screen.getByText('Kepler').closest('button')?.click();
    expect(onSelect).toHaveBeenCalledWith(mockEntity);
  });

  test('has listbox role', () => {
    render(<MentionPopup {...defaultProps} />);
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });
});
