/**
 * Column — The 640px centred content column (7.1)
 * The page of the notebook. The most important structural decision.
 * See: 02-visual-language.md, Spacing section.
 */
import React from 'react';
import styles from './Column.module.css';

interface ColumnProps {
  children: React.ReactNode;
  className?: string;
  /** Use wider max-width for structural chrome (header, nav). Content stays 640px. */
  wide?: boolean;
}

export function Column({ children, className, wide }: ColumnProps) {
  const base = wide ? styles.columnWide : styles.column;
  const cls = className ? `${base} ${className}` : base;

  return <div className={cls}>{children}</div>;
}
