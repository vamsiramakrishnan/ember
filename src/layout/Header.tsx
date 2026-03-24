/**
 * Header — Logo, notebook breadcrumb, navigation tabs, student identity.
 * Shows which notebook is active as a quiet breadcrumb.
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
  const { student, notebook, setNotebook, signOut } = useStudent();

  return (
    <header className={styles.header}>
      <Column wide>
        <div className={styles.row}>
          <div className={styles.breadcrumb}>
            <button
              className={styles.logo}
              aria-label="Ember — return to notebooks"
              onClick={signOut}
            >
              Ember
            </button>
            {notebook && (
              <>
                <span className={styles.separator}>·</span>
                <button
                  className={styles.notebookName}
                  onClick={() => setNotebook(null)}
                  aria-label="Back to notebook list"
                >
                  {notebook.title}
                </button>
              </>
            )}
          </div>
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
        <nav aria-label="Ember navigation">
          <Navigation active={activeSurface} onNavigate={onNavigate} />
        </nav>
      </Column>
    </header>
  );
}
