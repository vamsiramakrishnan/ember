/**
 * Footer — The quiet footer.
 * Nearly invisible. Present but not demanding.
 */
import { Column } from '@/primitives/Column';
import styles from './Footer.module.css';

export function Footer() {
  return (
    <footer className={styles.footer}>
      <Column>
        <p className={styles.text}>
          Ember — aristocratic tutoring for every child
        </p>
      </Column>
    </footer>
  );
}
