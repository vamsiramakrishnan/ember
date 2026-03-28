import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('@/primitives/Lightbox', () => ({
  Lightbox: ({ open, children }: { open: boolean; children: React.ReactNode }) =>
    open ? <div data-testid="lightbox">{children}</div> : null,
}));
vi.mock('../ReadingSlideView', () => ({
  ReadingSlideView: ({ slide }: { slide: { heading: string } }) => (
    <div data-testid="slide">{slide.heading}</div>
  ),
}));
vi.mock('../DeckToolbar', () => ({
  DeckToolbar: () => <div data-testid="toolbar" />,
}));

import { ReadingMaterial } from '../ReadingMaterial';
import type { ReadingSlide } from '@/types/entries';

const slides: ReadingSlide[] = [
  { heading: 'Page One', body: 'Content 1', layout: 'content' },
  { heading: 'Page Two', body: 'Content 2', layout: 'content' },
];

describe('ReadingMaterial', () => {
  test('renders title', () => {
    render(<ReadingMaterial title="Physics 101" slides={slides} />);
    expect(screen.getByText('Physics 101')).toBeInTheDocument();
  });

  test('shows page count', () => {
    render(<ReadingMaterial title="Physics 101" slides={slides} />);
    expect(screen.getByText('2 pages')).toBeInTheDocument();
  });

  test('shows click to read hint in thumbnail mode', () => {
    render(<ReadingMaterial title="Physics 101" slides={slides} />);
    expect(screen.getByText('click to read')).toBeInTheDocument();
  });

  test('expands when clicked', () => {
    render(<ReadingMaterial title="Physics 101" slides={slides} />);
    fireEvent.click(screen.getByLabelText('Expand reading material'));
    expect(screen.getByTestId('slide')).toBeInTheDocument();
    expect(screen.getByTestId('toolbar')).toBeInTheDocument();
  });

  test('shows pagination when expanded', () => {
    render(<ReadingMaterial title="Physics 101" slides={slides} />);
    fireEvent.click(screen.getByLabelText('Expand reading material'));
    expect(screen.getByText('1 / 2')).toBeInTheDocument();
  });

  test('navigates pages', () => {
    render(<ReadingMaterial title="Physics 101" slides={slides} />);
    fireEvent.click(screen.getByLabelText('Expand reading material'));
    fireEvent.click(screen.getByLabelText('Next page'));
    expect(screen.getByText('2 / 2')).toBeInTheDocument();
  });

  test('renders subtitle when provided', () => {
    render(<ReadingMaterial title="Physics" subtitle="An introduction" slides={slides} />);
    expect(screen.getByText('An introduction')).toBeInTheDocument();
  });
});
