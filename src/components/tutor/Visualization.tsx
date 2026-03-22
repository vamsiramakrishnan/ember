/**
 * Visualization — renders AI-generated interactive HTML inside
 * a sandboxed iframe. The tutor's whiteboard.
 * Features: auto-resize, loading skeleton, expand to full width.
 */
import { useRef, useEffect, useState, useCallback } from 'react';
import styles from './Visualization.module.css';

interface VisualizationProps {
  html: string;
  caption?: string;
}

export function Visualization({ html, caption }: VisualizationProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const handleLoad = () => {
      try {
        const doc = iframe.contentDocument;
        if (doc?.body) {
          const h = doc.body.scrollHeight;
          setHeight(Math.min(Math.max(h + 8, 200), 1200));
        }
      } catch {
        setHeight(400);
      }
      setLoaded(true);
    };

    iframe.addEventListener('load', handleLoad);
    return () => iframe.removeEventListener('load', handleLoad);
  }, [html]);

  const toggleExpand = useCallback(() => {
    setExpanded((v) => !v);
  }, []);

  const containerCls = [
    styles.container,
    expanded ? styles.expanded : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={containerCls}>
      {!loaded && <div className={styles.skeleton} />}
      <iframe
        ref={iframeRef}
        className={loaded ? styles.frame : styles.frameHidden}
        srcDoc={html}
        sandbox="allow-scripts"
        title={caption ?? 'Concept visualization'}
        style={{ height: height > 0 ? `${height}px` : '300px' }}
      />
      <div className={styles.toolbar}>
        {caption && (
          <p className={styles.caption}>{caption}</p>
        )}
        <button
          className={styles.expandBtn}
          onClick={toggleExpand}
          aria-label={expanded ? 'Collapse' : 'Expand'}
        >
          {expanded ? '↙' : '↗'}
        </button>
      </div>
    </div>
  );
}
