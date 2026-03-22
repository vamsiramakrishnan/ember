/**
 * useRevealSequence — staggered reveal animation for notebook entries.
 * Entries appear one by one with ~950ms intervals and 160ms stagger.
 * Creates the feeling of a conversation unfolding in time.
 * Respects prefers-reduced-motion: instantly reveals all entries.
 */
import { useState, useEffect, useRef } from 'react';
import { motion } from '@/tokens/motion';

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false,
  );

  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  return reduced;
}

export function useRevealSequence(totalItems: number) {
  const reducedMotion = usePrefersReducedMotion();
  const [revealedCount, setRevealedCount] = useState(
    reducedMotion ? totalItems : 0,
  );
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Reduced motion: reveal everything instantly
    if (reducedMotion) {
      setRevealedCount(totalItems);
      return;
    }
    if (revealedCount < totalItems) {
      const delay =
        revealedCount === 0 ? 300 : motion.revealInterval;
      timerRef.current = setTimeout(() => {
        setRevealedCount((c) => c + 1);
      }, delay);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [revealedCount, totalItems, reducedMotion]);

  return {
    revealedCount,
    getEntryStyle: (index: number): React.CSSProperties => {
      if (reducedMotion) return { opacity: 1 };

      const isRevealed = index < revealedCount;
      return {
        opacity: isRevealed ? 1 : 0,
        transform: isRevealed
          ? 'translateY(0)'
          : `translateY(${motion.entryTranslateY}px)`,
        transition: `opacity ${motion.entryDuration} ${motion.entryEase}, transform ${motion.entryDuration} ${motion.entryEase}`,
        transitionDelay: `${index * motion.revealStagger}ms`,
      };
    },
  };
}
