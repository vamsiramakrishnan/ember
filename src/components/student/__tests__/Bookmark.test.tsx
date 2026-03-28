import { describe, test, expect } from 'vitest';
import { render } from '@testing-library/react';

import { Bookmark } from '../Bookmark';

describe('Bookmark', () => {
  test('renders a div element', () => {
    const { container } = render(<Bookmark />);
    expect(container.firstElementChild).toBeTruthy();
    expect(container.firstElementChild?.tagName).toBe('DIV');
  });

  test('renders without crashing', () => {
    expect(() => render(<Bookmark />)).not.toThrow();
  });
});
