/**
 * Canvas Mode (4.1)
 * Transforms a section from linear flow to spatial arrangement.
 * Bordered region with dot grid, paper-warm background.
 * See: 06-component-inventory.md, Family 4.
 */
import React from 'react';
import styles from './CanvasMode.module.css';

interface CanvasModeProps {
  label?: string;
  children: React.ReactNode;
  minHeight?: number;
}

export function CanvasMode({
  label = 'canvas',
  children,
  minHeight = 300,
}: CanvasModeProps) {
  return (
    <div className={styles.container} style={{ minHeight }}>
      <div className={styles.label}>{label}</div>
      <div className={styles.content}>{children}</div>
    </div>
  );
}
