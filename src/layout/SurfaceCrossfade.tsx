/**
 * SurfaceCrossfade — wraps surface content with an opacity crossfade on switch.
 * was: instant mount/unmount, now: 300ms opacity fade with brief overlap
 * reason: surfaces should feel like spaces, not tabs
 * See audit item 3.6.
 */
import { useState, useEffect, useRef, type ReactNode } from 'react';
import styles from './SurfaceCrossfade.module.css';

interface SurfaceCrossfadeProps {
  /** Unique key for current surface (e.g. 'notebook'). */
  surfaceKey: string;
  children: ReactNode;
}

export function SurfaceCrossfade({ surfaceKey, children }: SurfaceCrossfadeProps) {
  const [displayedKey, setDisplayedKey] = useState(surfaceKey);
  const [displayedChildren, setDisplayedChildren] = useState(children);
  const [phase, setPhase] = useState<'visible' | 'fading-out' | 'fading-in'>('visible');
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (surfaceKey === displayedKey) {
      /* Same surface — just update children in place */
      setDisplayedChildren(children);
      return;
    }

    /* New surface: fade out → swap → fade in */
    setPhase('fading-out');

    timeoutRef.current = setTimeout(() => {
      setDisplayedKey(surfaceKey);
      setDisplayedChildren(children);
      setPhase('fading-in');

      timeoutRef.current = setTimeout(() => {
        setPhase('visible');
      }, 300);
    }, 250);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [surfaceKey]);

  /* When surface stays the same, keep children updated */
  useEffect(() => {
    if (surfaceKey === displayedKey && phase === 'visible') {
      setDisplayedChildren(children);
    }
  }, [children, surfaceKey, displayedKey, phase]);

  const className =
    phase === 'fading-out'
      ? styles.fadingOut
      : phase === 'fading-in'
        ? styles.fadingIn
        : styles.visible;

  return <div className={className}>{displayedChildren}</div>;
}
