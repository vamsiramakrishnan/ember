import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import { Carousel } from '../Carousel';

describe('Carousel', () => {
  test('renders children', () => {
    render(
      <Carousel>
        <div>Card 1</div>
        <div>Card 2</div>
      </Carousel>,
    );
    expect(screen.getByText('Card 1')).toBeInTheDocument();
    expect(screen.getByText('Card 2')).toBeInTheDocument();
  });

  test('renders label when provided', () => {
    render(
      <Carousel label="Related Thinkers">
        <div>A</div>
      </Carousel>,
    );
    expect(screen.getByText('Related Thinkers')).toBeInTheDocument();
  });

  test('does not render label when not provided', () => {
    const { container } = render(
      <Carousel>
        <div>A</div>
      </Carousel>,
    );
    expect(container.textContent).toBe('A');
  });

  test('renders without crashing with single child', () => {
    expect(() =>
      render(
        <Carousel>
          <div>Single</div>
        </Carousel>,
      ),
    ).not.toThrow();
  });
});
