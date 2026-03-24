/**
 * useScrollReveal — intersection observer hook for scroll-triggered fade-ins.
 * Returns a ref to attach and a boolean indicating visibility.
 * Once revealed, stays revealed (no re-hiding on scroll up).
 */
import { useRef, useState, useEffect } from 'react';

export function useScrollReveal(
  threshold = 0.15,
  rootMargin = '0px 0px -60px 0px',
): [React.RefObject<HTMLDivElement>, boolean] {
  const ref = useRef<HTMLDivElement>(null!);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Respect prefers-reduced-motion: reveal immediately
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq.matches) { setVisible(true); return; }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  return [ref, visible];
}
