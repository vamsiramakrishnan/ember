/**
 * LandingDemo — animated walkthrough of Ember's interaction vocabulary.
 * Four scenes auto-advance, showing typing, smart chips, canvas, and
 * constellation. Each scene crossfades into the next.
 */
import { useState, useEffect, useCallback } from 'react';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { LandingDemoNotebook } from './LandingDemoNotebook';
import { LandingDemoCanvas } from './LandingDemoCanvas';
import { LandingDemoConstellation } from './LandingDemoConstellation';
import styles from './LandingDemo.module.css';

type Scene = 'notebook' | 'canvas' | 'constellation';

const SCENES: { id: Scene; label: string; duration: number }[] = [
  { id: 'notebook', label: 'notebook', duration: 12000 },
  { id: 'canvas', label: 'canvas', duration: 7000 },
  { id: 'constellation', label: 'constellation', duration: 7000 },
];

export function LandingDemo() {
  const [ref, visible] = useScrollReveal(0.08);
  const [active, setActive] = useState(0);
  const [started, setStarted] = useState(false);

  // Start the sequence when scrolled into view
  useEffect(() => {
    if (visible && !started) setStarted(true);
  }, [visible, started]);

  // Auto-advance scenes
  useEffect(() => {
    if (!started) return;
    const t = setTimeout(() => {
      setActive((i) => (i + 1) % SCENES.length);
    }, SCENES[active]?.duration ?? 8000);
    return () => clearTimeout(t);
  }, [started, active]);

  const currentScene = SCENES[active]?.id ?? 'notebook';

  const handleDotClick = useCallback((i: number) => setActive(i), []);

  return (
    <section
      ref={ref}
      className={`${styles.section} ${visible ? styles.visible : ''}`}
      aria-label="How Ember works"
    >
      <div className={styles.label}>see it work</div>

      {/* Mock window frame */}
      <div className={styles.frame}>
        <div className={styles.titleBar}>
          <span className={styles.dot} />
          <span className={styles.dot} />
          <span className={styles.dot} />
          <div className={styles.tabs}>
            {SCENES.map((s, i) => (
              <button
                key={s.id}
                className={`${styles.tab} ${i === active ? styles.tabActive : ''}`}
                onClick={() => handleDotClick(i)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.viewport}>
          <div className={`${styles.scene} ${currentScene === 'notebook' ? styles.sceneActive : ''}`}>
            <LandingDemoNotebook active={started && currentScene === 'notebook'} />
          </div>
          <div className={`${styles.scene} ${currentScene === 'canvas' ? styles.sceneActive : ''}`}>
            <LandingDemoCanvas active={started && currentScene === 'canvas'} />
          </div>
          <div className={`${styles.scene} ${currentScene === 'constellation' ? styles.sceneActive : ''}`}>
            <LandingDemoConstellation active={started && currentScene === 'constellation'} />
          </div>
        </div>
      </div>

      {/* Progress dots */}
      <div className={styles.progress}>
        {SCENES.map((s, i) => (
          <button
            key={s.id}
            className={`${styles.progressDot} ${i === active ? styles.progressActive : ''}`}
            onClick={() => handleDotClick(i)}
            aria-label={`View ${s.label} demo`}
          />
        ))}
      </div>
    </section>
  );
}
