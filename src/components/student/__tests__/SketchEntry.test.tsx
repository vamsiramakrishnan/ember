import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import { SketchEntry } from '../SketchEntry';

describe('SketchEntry', () => {
  test('renders an image with the data URL', () => {
    render(<SketchEntry dataUrl="data:image/png;base64,abc" />);
    const img = screen.getByAltText('Student sketch') as HTMLImageElement;
    expect(img.src).toBe('data:image/png;base64,abc');
  });

  test('has correct alt text', () => {
    render(<SketchEntry dataUrl="data:image/png;base64,abc" />);
    expect(screen.getByAltText('Student sketch')).toBeInTheDocument();
  });

  test('wraps in a container with min height', () => {
    const { container } = render(<SketchEntry dataUrl="data:image/png;base64,abc" />);
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.style.minHeight).toBe('120px');
  });
});
