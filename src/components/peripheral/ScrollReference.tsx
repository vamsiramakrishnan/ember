/**
 * ScrollReference — ghost reference above the InputZone showing what
 * the student was reading before scrolling back to write.
 * Appears as a faint italic snippet with a dismiss action.
 */
import styles from './ScrollReference.module.css';

interface ScrollReferenceProps {
  snippet: string;
  onClear: () => void;
  onScrollTo: () => void;
}

export function ScrollReference({ snippet, onClear, onScrollTo }: ScrollReferenceProps) {
  return (
    <div className={styles.container}>
      <button
        className={styles.reference}
        onClick={onScrollTo}
        type="button"
        aria-label="Scroll to referenced entry"
      >
        <span className={styles.prefix}>responding to:</span>
        <span className={styles.snippet}>&ldquo;{snippet}&rdquo;</span>
      </button>
      <button
        className={styles.dismiss}
        onClick={onClear}
        type="button"
        aria-label="Dismiss reference"
      >
        &times;
      </button>
    </div>
  );
}
