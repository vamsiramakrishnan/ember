/**
 * Shell — Outer shell, background, global styles.
 * The warm paper surface. The reading lamp.
 */
import React from 'react';
import { getTokenCSS } from '@/tokens/custom-properties';
import '@/tokens/global.css';
import styles from './Shell.module.css';

interface ShellProps {
  children: React.ReactNode;
}

const tokenStyles = getTokenCSS();

export function Shell({ children }: ShellProps) {
  return (
    <>
      <style>{tokenStyles}</style>
      <div className={styles.shell}>{children}</div>
    </>
  );
}
