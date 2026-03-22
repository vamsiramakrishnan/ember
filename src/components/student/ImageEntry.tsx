/**
 * ImageEntry — renders an uploaded or pasted image.
 * Shows the image with optional alt text and caption.
 * The Reader agent can analyze it and the tutor can annotate.
 */
import styles from './ImageEntry.module.css';

interface ImageEntryProps {
  dataUrl: string;
  alt?: string;
  caption?: string;
}

export function ImageEntry({ dataUrl, alt, caption }: ImageEntryProps) {
  return (
    <figure className={styles.figure}>
      <img
        className={styles.image}
        src={dataUrl}
        alt={alt ?? 'Uploaded image'}
        loading="lazy"
      />
      {caption && (
        <figcaption className={styles.caption}>{caption}</figcaption>
      )}
    </figure>
  );
}
