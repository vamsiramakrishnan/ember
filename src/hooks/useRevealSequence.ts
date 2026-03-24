/**
 * useRevealSequence — staggered reveal animation for notebook entries.
 * Entries appear one by one with ~950ms intervals and 160ms stagger.
 * Creates the feeling of a conversation unfolding in time.
 *
 * Content-aware: different entry types get different animation curves.
 *   prose/scratch/question → standard upward fade (the default)
 *   tutor-marginalia/connection → slight left-in slide (margin annotation feel)
 *   concept-diagram/thinker-card → scale-up from center (visual weight)
 *   silence → very slow fade (breathing room)
 *   divider → instant (structural, not content)
 *
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

/** Entry type → animation variant. */
type AnimVariant = 'default' | 'margin' | 'visual' | 'silence' | 'instant';

const TYPE_VARIANT: Record<string, AnimVariant> = {
  'tutor-marginalia': 'margin', 'tutor-question': 'margin',
  'tutor-connection': 'margin', 'tutor-reflection': 'margin',
  'tutor-directive': 'margin', 'inline-response': 'margin',
  'concept-diagram': 'visual', 'thinker-card': 'visual',
  'visualization': 'visual', 'illustration': 'visual',
  'silence': 'silence', 'divider': 'instant',
};

function variantStyle(variant: AnimVariant, revealed: boolean): React.CSSProperties {
  if (variant === 'instant') return { opacity: 1 };
  if (revealed) return { opacity: 1, transform: 'translateY(0) translateX(0) scale(1)' };

  switch (variant) {
    case 'margin':
      return { opacity: 0, transform: `translateX(-6px)` };
    case 'visual':
      return { opacity: 0, transform: `scale(0.97)` };
    case 'silence':
      return { opacity: 0 };
    default:
      return { opacity: 0, transform: `translateY(${motion.entryTranslateY}px)` };
  }
}

function variantDuration(variant: AnimVariant): string {
  switch (variant) {
    case 'silence': return '1.2s';
    case 'visual': return '0.8s';
    case 'instant': return '0s';
    default: return motion.entryDuration;
  }
}

export function useRevealSequence(totalItems: number) {
  const reducedMotion = usePrefersReducedMotion();
  const [revealedCount, setRevealedCount] = useState(
    reducedMotion ? totalItems : 0,
  );
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (reducedMotion) { setRevealedCount(totalItems); return; }
    if (revealedCount < totalItems) {
      const delay = revealedCount === 0 ? 300 : motion.revealInterval;
      timerRef.current = setTimeout(() => setRevealedCount((c) => c + 1), delay);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [revealedCount, totalItems, reducedMotion]);

  return {
    revealedCount,
    getEntryStyle: (index: number, entryType?: string): React.CSSProperties => {
      if (reducedMotion) return { opacity: 1 };
      const isRevealed = index < revealedCount;
      const variant: AnimVariant = (entryType && TYPE_VARIANT[entryType]) || 'default';
      const dur = variantDuration(variant);
      return {
        ...variantStyle(variant, isRevealed),
        transition: `opacity ${dur} ${motion.entryEase}, transform ${dur} ${motion.entryEase}`,
        transitionDelay: `${index * motion.revealStagger}ms`,
      };
    },
  };
}
