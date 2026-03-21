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
}

export function Column({ children, className }: ColumnProps) {
  const cls = className
    ? `${styles.column} ${className}`
    : styles.column;

  return <div className={cls}>{children}</div>;
}
