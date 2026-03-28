import { describe, test, expect, vi } from 'vitest';
import { render } from '@testing-library/react';

vi.mock('../Rule.module.css', () => ({
  default: { rule: 'rule', ruleLight: 'ruleLight' },
}));

import { Rule } from '../Rule';

describe('Rule', () => {
  test('renders an hr element', () => {
    const { container } = render(<Rule />);
    expect(container.querySelector('hr')).toBeInTheDocument();
  });

  test('applies rule class by default', () => {
    const { container } = render(<Rule />);
    expect(container.querySelector('hr')).toHaveClass('rule');
  });

  test('applies ruleLight class for light variant', () => {
    const { container } = render(<Rule variant="ruleLight" />);
    expect(container.querySelector('hr')).toHaveClass('ruleLight');
  });

  test('applies custom width', () => {
    const { container } = render(<Rule width="50%" />);
    expect(container.querySelector('hr')).toHaveStyle({ width: '50%' });
  });

  test('applies custom margin', () => {
    const { container } = render(<Rule margin={24} />);
    expect(container.querySelector('hr')).toHaveStyle({ margin: '24px auto' });
  });
});
