/**
 * Carousel — horizontal scrollable card container.
 * Used when the tutor presents multiple related items
 * (thinkers, concepts, comparisons) that benefit from
 * side-by-side viewing. Scroll-snap for clean stops.
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
