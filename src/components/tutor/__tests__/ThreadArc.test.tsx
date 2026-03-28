import { describe, test, expect } from 'vitest';
import { render } from '@testing-library/react';

import { ThreadArc } from '../ThreadArc';

describe('ThreadArc', () => {
  test('renders a div element', () => {
    const { container } = render(<ThreadArc />);
    expect(container.firstElementChild?.tagName).toBe('DIV');
  });

  test('is hidden from screen readers', () => {
    const { container } = render(<ThreadArc />);
    expect(container.firstElementChild?.getAttribute('aria-hidden')).toBe('true');
  });

  test('renders without crashing for connection variant', () => {
    expect(() => render(<ThreadArc isConnection />)).not.toThrow();
  });

  test('renders without crashing for default variant', () => {
    expect(() => render(<ThreadArc />)).not.toThrow();
  });
});
