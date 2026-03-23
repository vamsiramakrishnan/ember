/**
 * NotebookModeToggle — switches between linear and canvas notebook modes.
 * See: 04-information-architecture.md, canvas mode toggle.
 */
import styles from './Notebook.module.css';

export type NotebookMode = 'linear' | 'canvas';

interface ModeToggleProps {
  mode: NotebookMode;
  setMode: (m: NotebookMode) => void;
}

export function NotebookModeToggle({ mode, setMode }: ModeToggleProps) {
  return (
    <div className={styles.modeToggle}>
      <button
        className={mode === 'linear' ? styles.modeActive : styles.modeButton}
        onClick={() => setMode('linear')}
        aria-current={mode === 'linear' ? 'page' : undefined}
      >Linear</button>
      <button
        className={mode === 'canvas' ? styles.modeActive : styles.modeButton}
        onClick={() => setMode('canvas')}
        aria-current={mode === 'canvas' ? 'page' : undefined}
      >Canvas</button>
    </div>
  );
}
