import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('../MarkdownContent.module.css', () => ({
  default: { pre: 'pre', codeFallback: 'codeFallback', codeBlock: 'codeBlock' },
}));
vi.mock('shiki', () => ({
  createHighlighter: vi.fn().mockResolvedValue({
    getLoadedLanguages: () => ['javascript'],
    codeToHtml: (_: string) => '<pre><code>highlighted</code></pre>',
    loadLanguage: vi.fn(),
  }),
}));

import { CodeBlock } from '../CodeBlock';

describe('CodeBlock', () => {
  test('renders fallback code block initially', () => {
    render(<CodeBlock language="python">print("hi")</CodeBlock>);
    expect(screen.getByText('print("hi")')).toBeInTheDocument();
  });

  test('renders code inside pre element', () => {
    const { container } = render(<CodeBlock language="js">const x = 1</CodeBlock>);
    const pre = container.querySelector('pre');
    expect(pre).toBeInTheDocument();
  });

  test('strips trailing newline from code', () => {
    render(<CodeBlock language="js">{'hello\n'}</CodeBlock>);
    expect(screen.getByText('hello')).toBeInTheDocument();
  });
});
