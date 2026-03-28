/**
 * StatusNarrator — streaming narration display for long-running processes.
 *
 * Subscribes to the Gemma-powered status narrator and renders the
 * streaming text with a gentle character-by-character reveal effect.
 * Falls back gracefully to nothing if narration is empty (letting
 * the parent TutorActivity show its static label instead).
 *
 * The narration text appears as warm, specific descriptions:
 *   "tracing the etymology of 'resonance'..."
 *   "connecting Kepler's harmonics to Pythagoras..."
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { subscribeNarration, getCurrentNarration } from '@/services/status-narrator';
import styles from './StatusNarrator.module.css';

export function StatusNarrator() {
  const [text, setText] = useState(() => getCurrentNarration());
  const [displayed, setDisplayed] = useState('');
  const rafRef = useRef(0);
  const targetRef = useRef('');

  // Subscribe to narration updates
  useEffect(() => {
    return subscribeNarration((narration) => {
      setText(narration);
      targetRef.current = narration;
    });
  }, []);

  // Animate character reveal
  const animate = useCallback(() => {
    setDisplayed((prev) => {
      const target = targetRef.current;
      if (!target) return '';
      if (prev.length >= target.length) return target;
      // Reveal 1-2 chars per frame for smooth streaming feel
      const next = target.slice(0, prev.length + 2);
      if (next.length < target.length) {
        rafRef.current = requestAnimationFrame(animate);
      }
      return next;
    });
  }, []);

  useEffect(() => {
    if (text) {
      rafRef.current = requestAnimationFrame(animate);
    } else {
      setDisplayed('');
    }
    return () => cancelAnimationFrame(rafRef.current);
  }, [text, animate]);

  if (!displayed) return null;

  return (
    <span className={styles.narration} aria-live="polite">
      {displayed}
      <span className={styles.cursor} aria-hidden="true" />
    </span>
  );
}
