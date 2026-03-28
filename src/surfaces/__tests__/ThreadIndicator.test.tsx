import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('../ThreadIndicator.module.css', () => ({ default: {} }));

import { vi } from 'vitest';
import { ThreadIndicator } from '../ThreadIndicator';

describe('ThreadIndicator', () => {
  test('renders nothing when neither response nor thread start', () => {
    const { container } = render(
      <ThreadIndicator isResponse={false} isThreadStart={false} />,
    );
    expect(container.firstChild).toBeNull();
  });

  test('renders when isResponse is true', () => {
    const { container } = render(
      <ThreadIndicator isResponse={true} isThreadStart={false} />,
    );
    expect(container.firstChild).not.toBeNull();
  });

  test('renders when isThreadStart is true', () => {
    const { container } = render(
      <ThreadIndicator isResponse={false} isThreadStart={true} />,
    );
    expect(container.firstChild).not.toBeNull();
  });

  test('has aria-hidden on the container', () => {
    const { container } = render(
      <ThreadIndicator isResponse={true} isThreadStart={false} />,
    );
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true');
  });
});
