/**
 * useTypewriter — reveals text character-by-character with configurable speed.
 * Returns the visible portion of the string. Pauses briefly at punctuation.
 * Respects prefers-reduced-motion (reveals all instantly).
 */
import { useState, useEffect, useRef } from 'react';

export function useTypewriter(
  text: string,
  active: boolean,
  speed = 35,
): string {
  const [index, setIndex] = useState(0);
  const reduced = useRef(false);

  useEffect(() => {
    reduced.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  useEffect(() => {
    if (!active) { setIndex(0); return; }
    if (reduced.current) { setIndex(text.length); return; }
    if (index >= text.length) return;

    const char = text[index];
    const pause = char === '.' || char === ',' || char === '—' ? speed * 4 : speed;

    const t = setTimeout(() => setIndex((i) => i + 1), pause);
    return () => clearTimeout(t);
  }, [active, index, text, speed]);

  return text.slice(0, index);
}
