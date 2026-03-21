/**
 * Navigation — Three text labels: Notebook, Constellation, Philosophy.
 * Cormorant Garamond 14px, on a thin ruled line.
 * See: 04-information-architecture.md, Navigation.
 */
import styles from './Navigation.module.css';

export type Surface = 'notebook' | 'constellation' | 'philosophy';

interface NavigationProps {
  active: Surface;
  onNavigate: (surface: Surface) => void;
}

const tabs: { id: Surface; label: string }[] = [
  { id: 'notebook', label: 'Notebook' },
  { id: 'constellation', label: 'Constellation' },
  { id: 'philosophy', label: 'Philosophy' },
];

export function Navigation({ active, onNavigate }: NavigationProps) {
  return (
    <nav className={styles.nav} aria-label="Ember surfaces">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onNavigate(tab.id)}
          aria-current={tab.id === active ? 'page' : undefined}
          className={
            tab.id === active ? styles.tabActive : styles.tabInactive
          }
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
