/**
 * Column — The 640px centred content column (7.1)
 * The page of the notebook. The most important structural decision.
 * See: 02-visual-language.md, Spacing section.
 */
import React from 'react';
import { spacing } from '@/tokens/spacing';

interface ColumnProps {
  children: React.ReactNode;
  className?: string;
}

export function Column({ children, className }: ColumnProps) {
  return (
    <div
      className={className}
      style={{
        maxWidth: spacing.columnWidth,
        margin: '0 auto',
        paddingLeft: spacing.columnPadding,
        paddingRight: spacing.columnPadding,
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      {children}
    </div>
  );
}
