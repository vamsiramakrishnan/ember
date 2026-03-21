/**
 * Header — Logo, navigation tabs, student identity.
 * Quiet, functional, never competing with the content.
 */
import { Column } from '@/primitives/Column';
import { Navigation, type Surface } from './Navigation';
import { StudentIdentity } from '@/components/peripheral/StudentIdentity';
import styles from './Header.module.css';

interface HeaderProps {
  activeSurface: Surface;
  onNavigate: (surface: Surface) => void;
}

export function Header({ activeSurface, onNavigate }: HeaderProps) {
  return (
    <header className={styles.header}>
      <Column>
        <div className={styles.row}>
          <h1 className={styles.logo}>Ember</h1>
          <StudentIdentity
            name="Arjun"
            duration="4 months"
            sessionNumber={47}
          />
        </div>
        <Navigation active={activeSurface} onNavigate={onNavigate} />
      </Column>
    </header>
  );
}
