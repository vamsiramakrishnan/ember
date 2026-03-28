import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Text } from '../Text';

describe('Text', () => {
  test('renders children text', () => {
    render(<Text variant="studentText">Hello, Ember.</Text>);
    expect(screen.getByText('Hello, Ember.')).toBeInTheDocument();
  });

  test('defaults to a span element', () => {
    render(<Text variant="studentText">Default span</Text>);
    const el = screen.getByText('Default span');
    expect(el.tagName).toBe('SPAN');
  });

  test('renders as a different HTML element via "as" prop', () => {
    render(
      <Text variant="pageTitle" as="h2">
        Heading text
      </Text>,
    );
    const el = screen.getByText('Heading text');
    expect(el.tagName).toBe('H2');
  });

  test('renders as a paragraph element', () => {
    render(
      <Text variant="studentText" as="p">
        Paragraph text
      </Text>,
    );
    const el = screen.getByText('Paragraph text');
    expect(el.tagName).toBe('P');
  });

  test('applies inline styles from the type scale', () => {
    render(<Text variant="tutorMarginalia">Styled text</Text>);
    const el = screen.getByText('Styled text');
    expect(el.style.fontFamily).toBeTruthy();
    expect(el.style.fontSize).toBe('17.5px');
  });

  test('applies additional className when provided', () => {
    render(
      <Text variant="studentText" className="custom-class">
        Classed text
      </Text>,
    );
    const el = screen.getByText('Classed text');
    expect(el.className).toContain('custom-class');
  });
});
