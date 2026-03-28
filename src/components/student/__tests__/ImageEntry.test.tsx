import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import { ImageEntry } from '../ImageEntry';

describe('ImageEntry', () => {
  test('renders an image with the data URL', () => {
    render(<ImageEntry dataUrl="data:image/png;base64,abc" />);
    const img = screen.getByRole('img') as HTMLImageElement;
    expect(img.src).toBe('data:image/png;base64,abc');
  });

  test('uses custom alt text when provided', () => {
    render(<ImageEntry dataUrl="data:image/png;base64,abc" alt="A diagram" />);
    expect(screen.getByAltText('A diagram')).toBeInTheDocument();
  });

  test('uses default alt text when not provided', () => {
    render(<ImageEntry dataUrl="data:image/png;base64,abc" />);
    expect(screen.getByAltText('Uploaded image')).toBeInTheDocument();
  });

  test('renders caption when provided', () => {
    render(<ImageEntry dataUrl="data:image/png;base64,abc" caption="Fig 1" />);
    expect(screen.getByText('Fig 1')).toBeInTheDocument();
  });

  test('does not render caption when not provided', () => {
    const { container } = render(<ImageEntry dataUrl="data:image/png;base64,abc" />);
    expect(container.querySelector('figcaption')).not.toBeInTheDocument();
  });

  test('renders as a figure element', () => {
    const { container } = render(<ImageEntry dataUrl="data:image/png;base64,abc" />);
    expect(container.querySelector('figure')).toBeInTheDocument();
  });
});
