/**
 * CrossNavBreadcrumb — quiet "← back to graph" affordance after cross-mode navigation.
 * Fades in when active, auto-dismisses after 6 seconds.
 */
import type { NotebookMode } from '@/surfaces/NotebookModeToggle';
import styles from './CrossNavBreadcrumb.module.css';

interface CrossNavBreadcrumbProps {
  sourceMode: NotebookMode | null;
  entityLabel: string | null;
  onBack: () => void;
  onDismiss: () => void;
}

const MODE_LABELS: Record<NotebookMode, string> = {
  linear: 'notebook',
  canvas: 'canvas',
  graph: 'graph',
};

export function CrossNavBreadcrumb({
  sourceMode, entityLabel, onBack, onDismiss,
}: CrossNavBreadcrumbProps) {
  if (!sourceMode) return null;

  return (
    <div className={styles.breadcrumb}>
      <button className={styles.backButton} onClick={onBack}>
        <span className={styles.arrow}>←</span>
        back to {MODE_LABELS[sourceMode]}
      </button>
      {entityLabel && (
        <span className={styles.entityLabel}>{entityLabel}</span>
      )}
      <button className={styles.dismiss} onClick={onDismiss} aria-label="Dismiss">
        ×
      </button>
    </div>
  );
}
