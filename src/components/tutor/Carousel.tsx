/**
 * Carousel — horizontal scrollable card container with scroll-snap.
 * Post-spec extension: not in the original component inventory (06).
 * Added to support side-by-side viewing of multiple tutor-presented items
 * (thinker cards, concept comparisons) that benefit from horizontal browsing.
 * Related: 06-component-inventory.md Family 2 (tutor elements, esp. 2.5 ThinkerCard),
 *          07-compositional-grammar.md (how elements compose)
 */
import React, { useRef, useState, useCallback, useEffect } from 'react';
import styles from './Carousel.module.css';

interface CarouselProps {
  label?: string;
  children: React.ReactNode;
}

export function Carousel({ label, children }: CarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (trackRef.current) {
      setTotal(trackRef.current.children.length);
    }
  }, [children]);

  const handleScroll = useCallback(() => {
    const el = trackRef.current;
    if (!el || total === 0) return;
    const scrollLeft = el.scrollLeft;
    const cardWidth = el.scrollWidth / total;
    setActiveIdx(Math.round(scrollLeft / cardWidth));
  }, [total]);

  return (
    <div className={styles.container}>
      {label && <span className={styles.label}>{label}</span>}
      <div
        className={styles.track}
        ref={trackRef}
        onScroll={handleScroll}
      >
        {children}
      </div>
      {total > 1 && (
        <div className={styles.dots} aria-hidden="true">
          {Array.from({ length: total }, (_, i) => (
            <span
              key={i}
              className={i === activeIdx ? styles.dotActive : styles.dot}
            />
          ))}
        </div>
      )}
    </div>
  );
}
