/**
 * Visualization — three-level progressive disclosure for HTML artifacts.
 * 1. THUMBNAIL: compact, faded bottom edge, click to expand
 * 2. EXPANDED: full height inline, with collapse + full-view buttons
 * 3. MODAL: full-viewport lightbox via portal, escape to close
 */
import { useRef, useEffect, useState, useCallback } from 'react';
import { Lightbox } from '@/primitives/Lightbox';
import styles from './Visualization.module.css';

interface VisualizationProps { html: string; caption?: string }
type ViewLevel = 'thumbnail' | 'expanded' | 'modal';

const THUMB_H = 280;
const MAX_H = 1200;

export function Visualization({ html, caption }: VisualizationProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const modalRef = useRef<HTMLIFrameElement>(null);
  const [contentH, setContentH] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [level, setLevel] = useState<ViewLevel>('thumbnail');

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const onLoad = () => {
      try { setContentH(Math.min(Math.max((iframe.contentDocument?.body?.scrollHeight ?? 400) + 8, 200), MAX_H)); }
      catch { setContentH(400); }
      setLoaded(true);
    };
    iframe.addEventListener('load', onLoad);
    return () => iframe.removeEventListener('load', onLoad);
  }, [html]);

  // Auto-size modal iframe
  useEffect(() => {
    if (level !== 'modal') return;
    const iframe = modalRef.current;
    if (!iframe) return;
    const onLoad = () => {
      try { iframe.style.height = `${Math.min((iframe.contentDocument?.body?.scrollHeight ?? 600) + 8, window.innerHeight - 96)}px`; }
      catch { iframe.style.height = '600px'; }
    };
    iframe.addEventListener('load', onLoad);
    return () => iframe.removeEventListener('load', onLoad);
  }, [level, html]);

  const expand = useCallback(() => setLevel('expanded'), []);
  const openModal = useCallback(() => setLevel('modal'), []);
  const collapse = useCallback(() => setLevel('thumbnail'), []);
  const closeModal = useCallback(() => setLevel('expanded'), []);

  const isThumb = level === 'thumbnail';
  const needsFade = isThumb && contentH > THUMB_H;
  const displayH = isThumb ? Math.min(contentH, THUMB_H) : contentH;

  const cls = `${styles.container} ${level === 'expanded' ? styles.expanded ?? '' : ''}`;

  return (
    <>
      <div className={cls}>
        {!loaded && <div className={styles.skeleton} />}
        <div className={styles.frameWrap}
          style={{ height: loaded ? `${displayH}px` : '280px' }}
          onClick={isThumb ? expand : undefined}
          role={isThumb ? 'button' : undefined}
          tabIndex={isThumb ? 0 : undefined}
          aria-label={isThumb ? 'Expand visualization' : undefined}
          onKeyDown={isThumb ? (e) => { if (e.key === 'Enter') expand(); } : undefined}>
          <iframe ref={iframeRef}
            className={loaded ? styles.frame : styles.frameHidden}
            srcDoc={html} sandbox="allow-scripts"
            title={caption ?? 'Concept visualization'}
            style={{ height: `${contentH}px` }} />
          {needsFade && <div className={styles.fade} />}
          {isThumb && loaded && (
            <div className={styles.thumbHint}>
              <span className={styles.thumbLabel}>click to expand</span>
            </div>
          )}
        </div>
        <div className={styles.toolbar}>
          {caption && <p className={styles.caption}>{caption}</p>}
          <div className={styles.actions}>
            {level === 'expanded' && (
              <>
                <button className={styles.actionBtn} onClick={openModal}
                  aria-label="Open full view">↗ full view</button>
                <button className={styles.actionBtn} onClick={collapse}
                  aria-label="Collapse">↙ collapse</button>
              </>
            )}
          </div>
        </div>
      </div>
      <Lightbox open={level === 'modal'} onClose={closeModal}>
        <iframe ref={modalRef} className={styles.modalFrame}
          srcDoc={html} sandbox="allow-scripts"
          title={caption ?? 'Visualization — full view'} />
      </Lightbox>
    </>
  );
}
