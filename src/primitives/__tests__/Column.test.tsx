import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('../Column.module.css', () => ({
  default: { column: 'column', columnWide: 'columnWide' },
}));

import { Column } from '../Column';

describe('Column', () => {
  test('renders children', () => {
    render(<Column>Content</Column>);
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  test('applies column class by default', () => {
    const { container } = render(<Column>Content</Column>);
    expect(container.firstChild).toHaveClass('column');
  });

  test('applies wide class when wide prop set', () => {
    const { container } = render(<Column wide>Content</Column>);
    expect(container.firstChild).toHaveClass('columnWide');
  });

  test('applies additional className', () => {
    const { container } = render(<Column className="extra">Content</Column>);
    expect(container.firstChild).toHaveClass('extra');
  });
});
