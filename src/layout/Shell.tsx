/**
 * Shell — Outer shell, background, global styles.
 * The warm paper surface. The reading lamp.
 */
import React from 'react';
import { colors } from '@/tokens/colors';

interface ShellProps {
  children: React.ReactNode;
}

const globalStyles = `
  *, *::before, *::after {
    box-sizing: border-box;
  }
  html {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  body {
    margin: 0;
    padding: 0;
    background-color: ${colors.paper};
    color: ${colors.ink};
    min-height: 100vh;
  }
  ::selection {
    background-color: rgba(184, 86, 79, 0.15);
  }
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
`;

export function Shell({ children }: ShellProps) {
  return (
    <>
      <style>{globalStyles}</style>
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: colors.paper,
        }}
      >
        {children}
      </div>
    </>
  );
}
