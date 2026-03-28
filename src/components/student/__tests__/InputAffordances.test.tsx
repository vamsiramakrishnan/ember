import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import { InputAffordances } from '../InputAffordances';

describe('InputAffordances', () => {
  test('renders hint labels', () => {
    render(<InputAffordances />);
    expect(screen.getByText('commands')).toBeInTheDocument();
    expect(screen.getByText('reference')).toBeInTheDocument();
    expect(screen.getByText('ask tutor')).toBeInTheDocument();
  });

  test('renders hint keys', () => {
    render(<InputAffordances />);
    expect(screen.getByText('/')).toBeInTheDocument();
    expect(screen.getByText('@')).toBeInTheDocument();
    expect(screen.getByText('?')).toBeInTheDocument();
  });

  test('is hidden from screen readers', () => {
    const { container } = render(<InputAffordances />);
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.getAttribute('aria-hidden')).toBe('true');
  });
});
