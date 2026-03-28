/**
 * PhilosophyStarfield — Ambient star-point layer for the Philosophy surface.
 * Renders SVG dots at varying sizes and opacities, with:
 *   - Slow ambient drift (120s loop, imperceptible)
 *   - Cursor-position parallax (near/mid/far depth layers, max ±4px)
 * See: 04-information-architecture.md, Surface 3 — "The Star Chart"
 */
import { useRef, useEffect, useCallback, useMemo } from 'react';
import styles from './PhilosophyStarfield.module.css';

interface Star {
  cx: number; // 0–100 (%)
  cy: number; // 0–100 (%)
  r: number;  // radius in px
  opacity: number;
  layer: 'near' | 'mid' | 'far';
}

/** Seeded PRNG for deterministic star placement. */
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/** viewBox is 1000x2000 — radii of 1–2.5 are truly tiny at this scale. */
const VB_W = 1000;
const VB_H = 2000;

function generateStars(count: number): Star[] {
  const rand = seededRandom(42);
  const stars: Star[] = [];
  for (let i = 0; i < count; i++) {
    const layerRoll = rand();
    const layer = layerRoll < 0.2 ? 'near' : layerRoll < 0.55 ? 'mid' : 'far';
    stars.push({
      cx: rand() * VB_W,
      cy: rand() * VB_H,
      r: layer === 'near' ? 1.8 + rand() * 0.7 : layer === 'mid' ? 1.0 + rand() * 0.5 : 0.6 + rand() * 0.4,
      opacity: layer === 'near' ? 0.10 + rand() * 0.06 : layer === 'mid' ? 0.06 + rand() * 0.04 : 0.03 + rand() * 0.03,
      layer,
    });
  }
  return stars;
}

/** Max parallax offset by depth layer (px). */
const PARALLAX_MAX = { near: 4, mid: 2, far: 1 } as const;

export function PhilosophyStarfield() {
  const containerRef = useRef<HTMLDivElement>(null);
  const nearRef = useRef<SVGGElement>(null);
  const midRef = useRef<SVGGElement>(null);
  const farRef = useRef<SVGGElement>(null);
  const rafRef = useRef<number>(0);

  const stars = useMemo(() => generateStars(60), []);

  const nearStars = useMemo(() => stars.filter(s => s.layer === 'near'), [stars]);
  const midStars = useMemo(() => stars.filter(s => s.layer === 'mid'), [stars]);
  const farStars = useMemo(() => stars.filter(s => s.layer === 'far'), [stars]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const container = containerRef.current;
    if (!container) return;

    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const rect = container.getBoundingClientRect();
      /* Normalized cursor position: 0 = left/top, 1 = right/bottom */
      const nx = (e.clientX - rect.left) / rect.width;
      const ny = (e.clientY - rect.top) / rect.height;
      /* Map to ±1 centered */
      const cx = (nx - 0.5) * 2;
      const cy = (ny - 0.5) * 2;

      const applyOffset = (el: SVGGElement | null, max: number) => {
        if (!el) return;
        const dx = cx * max;
        const dy = cy * max;
        el.style.transform = `translate(${dx}px, ${dy}px)`;
      };

      applyOffset(nearRef.current, PARALLAX_MAX.near);
      applyOffset(midRef.current, PARALLAX_MAX.mid);
      applyOffset(farRef.current, PARALLAX_MAX.far);
    });
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.addEventListener('mousemove', handleMouseMove);
    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, [handleMouseMove]);

  const renderStars = (layerStars: Star[]) =>
    layerStars.map((s, i) => (
      <circle
        key={i}
        cx={s.cx}
        cy={s.cy}
        r={s.r}
        fill="currentColor"
        opacity={s.opacity}
      />
    ));

  return (
    <div ref={containerRef} className={styles.starfield} aria-hidden="true">
      <svg
        className={styles.svg}
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g ref={farRef} className={styles.layerFar}>{renderStars(farStars)}</g>
        <g ref={midRef} className={styles.layerMid}>{renderStars(midStars)}</g>
        <g ref={nearRef} className={styles.layerNear}>{renderStars(nearStars)}</g>
      </svg>
    </div>
  );
}
