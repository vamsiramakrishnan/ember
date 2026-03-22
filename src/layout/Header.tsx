/**
 * Header — Logo, navigation tabs, student identity.
 * Now reads from StudentContext instead of hardcoded values.
 */
import { Column } from '@/primitives/Column';
import { Navigation, type Surface } from './Navigation';
import { StudentIdentity } from '@/components/peripheral/StudentIdentity';
import { useStudent } from '@/contexts/StudentContext';
import styles from './Header.module.css';

interface HeaderProps {
  activeSurface: Surface;
  onNavigate: (surface: Surface) => void;
}

export function Header({ activeSurface, onNavigate }: HeaderProps) {
  const { student, signOut } = useStudent();

  return (
    <header className={styles.header}>
      <Column>
        <div className={styles.row}>
          <button
            className={styles.logo}
            aria-label="Ember — return to notebooks"
            onClick={signOut}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            Ember
          </button>
          {student && (
            <StudentIdentity
              name={student.displayName}
              duration={
                student.totalMinutes > 0
                  ? `${Math.round(student.totalMinutes / 60)} hours`
                  : 'just beginning'
              }
              sessionNumber={0}
            />
          )}
        </div>
        <Navigation active={activeSurface} onNavigate={onNavigate} />
      </Column>
    </header>
  );
}
