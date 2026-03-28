import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import { Divider } from '../Divider';

describe('Divider', () => {
  test('renders an hr element', () => {
    const { container } = render(<Divider />);
    expect(container.querySelector('hr')).toBeInTheDocument();
  });

  test('renders label when provided', () => {
    render(<Divider label="Section Break" />);
    expect(screen.getByText('Section Break')).toBeInTheDocument();
  });

  test('does not render label when not provided', () => {
    const { container } = render(<Divider />);
    // Only hr inside the container div, no label div
    const children = container.firstElementChild?.children;
    expect(children?.length).toBe(1);
  });
});
