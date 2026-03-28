import { describe, test, expect, vi } from 'vitest';
import { render } from '@testing-library/react';

vi.mock('@/tokens/colors', () => ({
  colors: { inkSoft: '#5A534D' },
}));

import { Sketch } from '../Sketch';

describe('Sketch', () => {
  test('renders a canvas element', () => {
    const { container } = render(<Sketch />);
    expect(container.querySelector('canvas')).toBeInTheDocument();
  });

  test('uses default height of 160', () => {
    const { container } = render(<Sketch />);
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.style.minHeight).toBe('160px');
  });

  test('accepts custom height', () => {
    const { container } = render(<Sketch height={240} />);
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.style.minHeight).toBe('240px');
  });

  test('canvas has correct dimensions', () => {
    const { container } = render(<Sketch height={200} />);
    const canvas = container.querySelector('canvas') as HTMLCanvasElement;
    expect(canvas.width).toBe(560);
    expect(canvas.height).toBe(200);
  });
});
