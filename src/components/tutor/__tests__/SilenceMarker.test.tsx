import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import { SilenceMarker } from '../SilenceMarker';

describe('SilenceMarker', () => {
  test('renders with status role', () => {
    render(<SilenceMarker />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  test('has accessible label', () => {
    render(<SilenceMarker />);
    expect(
      screen.getByLabelText('The tutor is waiting for you to think'),
    ).toBeInTheDocument();
  });

  test('renders text when provided', () => {
    render(<SilenceMarker text="Take your time." />);
    expect(screen.getByText('Take your time.')).toBeInTheDocument();
  });

  test('does not render text when not provided', () => {
    const { container } = render(<SilenceMarker />);
    expect(container.querySelector('p')).not.toBeInTheDocument();
  });

  test('renders cursor element', () => {
    const { container } = render(<SilenceMarker />);
    // cursor and verticalRule are aria-hidden
    const hiddenElements = container.querySelectorAll('[aria-hidden="true"]');
    expect(hiddenElements.length).toBeGreaterThanOrEqual(1);
  });
});
