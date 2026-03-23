/**
 * Illustration — renders AI-generated concept sketches with
 * progressive disclosure: thumbnail → click to open in lightbox.
 */
import { useState, useCallback } from 'react';
import { Lightbox } from '@/primitives/Lightbox';
import styles from './Illustration.module.css';

interface IllustrationProps {
  dataUrl: string;
  caption?: string;
}

export function Illustration({ dataUrl, caption }: IllustrationProps) {
  const [open, setOpen] = useState(false);
  const openModal = useCallback(() => setOpen(true), []);
  const closeModal = useCallback(() => setOpen(false), []);

  return (
    <>
      <figure className={styles.figure}>
        <button className={styles.imageBtn} onClick={openModal}
          aria-label="View illustration full size">
          <img className={styles.image} src={dataUrl}
            alt={caption ?? 'Concept illustration'} loading="lazy" />
          <span className={styles.expandHint}>click to enlarge</span>
        </button>
        {caption && <figcaption className={styles.caption}>{caption}</figcaption>}
      </figure>
      <Lightbox open={open} onClose={closeModal}>
        <img className={styles.modalImage} src={dataUrl}
          alt={caption ?? 'Concept illustration — full view'} />
      </Lightbox>
    </>
  );
}
