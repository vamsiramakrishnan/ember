/**
 * SketchEntry (1.4 — rendered form)
 * Displays a saved sketch as an image.
 * See: 06-component-inventory.md, Family 1.
 */
import styles from './Sketch.module.css';

interface SketchEntryProps {
  dataUrl: string;
}

export function SketchEntry({ dataUrl }: SketchEntryProps) {
  return (
    <div className={styles.canvas} style={{ minHeight: 120 }}>
      <img
        src={dataUrl}
        alt="Student sketch"
        style={{ display: 'block', width: '100%' }}
      />
    </div>
  );
}
