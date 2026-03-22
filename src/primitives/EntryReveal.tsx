/**
 * EntryReveal — wraps an entry with a staggered reveal animation.
 * Words appearing on a page, not flying in from offscreen.
 *
 * Spec: 6–8px vertical translation, 0.6–0.8s ease.
 * Respects prefers-reduced-motion.
 */
import { useRef, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import styles from './EntryReveal.module.css';

interface EntryRevealProps {
  children: ReactNode;
  /** Delay before reveal starts (for staggering). */
  delay?: number;
}

export function EntryReveal({ children, delay = 0 }: EntryRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setRevealed(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      ref={ref}
      className={`${styles.reveal} ${revealed ? styles.visible : ''}`}
      style={delay > 0 ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
