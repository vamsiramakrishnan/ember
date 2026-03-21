/**
 * useRevealSequence — staggered reveal animation for notebook entries.
 * Entries appear one by one with ~950ms intervals and 160ms stagger.
 * Creates the feeling of a conversation unfolding in time.
 */
import { useState, useEffect, useRef } from 'react';
import { motion } from '@/tokens/motion';

export function useRevealSequence(totalItems: number) {
  const [revealedCount, setRevealedCount] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
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
  }, [revealedCount, totalItems]);

  return {
    revealedCount,
    getEntryStyle: (index: number): React.CSSProperties => {
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
