import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('@/primitives/Lightbox', () => ({
  Lightbox: ({ open, children }: { open: boolean; children: React.ReactNode }) =>
    open ? <div data-testid="lightbox">{children}</div> : null,
}));

import { Illustration } from '../Illustration';

describe('Illustration', () => {
  test('renders image with data URL', () => {
    render(<Illustration dataUrl="data:image/png;base64,abc" />);
    const img = screen.getByAltText('Concept illustration');
    expect(img).toHaveAttribute('src', 'data:image/png;base64,abc');
  });

  test('renders custom caption', () => {
    render(<Illustration dataUrl="data:image/png;base64,abc" caption="Orbital paths" />);
    expect(screen.getByText('Orbital paths')).toBeInTheDocument();
  });

  test('does not render caption when not provided', () => {
    const { container } = render(<Illustration dataUrl="data:image/png;base64,abc" />);
    expect(container.querySelector('figcaption')).not.toBeInTheDocument();
  });

  test('shows expand hint', () => {
    render(<Illustration dataUrl="data:image/png;base64,abc" />);
    expect(screen.getByText('click to enlarge')).toBeInTheDocument();
  });

  test('opens lightbox on click', () => {
    render(<Illustration dataUrl="data:image/png;base64,abc" />);
    fireEvent.click(screen.getByLabelText('View illustration full size'));
    expect(screen.getByTestId('lightbox')).toBeInTheDocument();
  });

  test('renders as figure element', () => {
    const { container } = render(<Illustration dataUrl="data:image/png;base64,abc" />);
    expect(container.querySelector('figure')).toBeInTheDocument();
  });
});
