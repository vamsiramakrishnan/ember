/**
 * NotebookList — renders the grid of existing notebooks and
 * the creation form. Extracted from NotebookSelect for 150-line discipline.
 */
import type { NotebookRecord } from '@/persistence/records';
import styles from './NotebookSelect.module.css';

interface Props {
  notebooks: NotebookRecord[];
  showForm: boolean;
  title: string;
  question: string;
  onSelect: (nb: NotebookRecord) => void;
  onShowForm: () => void;
  onHideForm: () => void;
  onTitleChange: (v: string) => void;
  onQuestionChange: (v: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onCreate: () => void;
}

export function NotebookList({
  notebooks, showForm, title, question,
  onSelect, onShowForm, onHideForm,
  onTitleChange, onQuestionChange, onKeyDown, onCreate,
}: Props) {
  return (
    <div className={styles.section}>
      <div className={styles.sectionLabel}>
        {notebooks.length > 0 ? 'Your notebooks' : 'Start exploring'}
      </div>
      <div className={styles.notebookList}>
        {notebooks.map((nb) => (
          <button
            key={nb.id}
            className={styles.notebookCard}
            onClick={() => onSelect(nb)}
          >
            <div className={styles.notebookRow}>
              {nb.iconDataUrl && (
                <img
                  src={nb.iconDataUrl}
                  alt=""
                  className={styles.notebookIcon}
                  aria-hidden="true"
                />
              )}
              <div className={styles.notebookContent}>
                <div className={styles.notebookTitle}>{nb.title}</div>
                {nb.description && (
                  <div className={styles.notebookDesc}>{nb.description}</div>
                )}
                <div className={styles.notebookMeta}>
                  {nb.sessionCount} {nb.sessionCount === 1 ? 'session' : 'sessions'}
                  {nb.discipline && <span> · {nb.discipline}</span>}
                </div>
                {nb.tags && nb.tags.length > 0 && (
                  <div className={styles.notebookTags}>
                    {nb.tags.map((tag) => (
                      <span key={tag} className={styles.tag}>{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </button>
        ))}
        {!showForm ? (
          <button className={styles.newButton} onClick={onShowForm}>
            begin a new exploration
          </button>
        ) : (
          <div className={styles.form}>
            <input
              className={styles.input}
              type="text"
              placeholder="What do you want to explore?"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              onKeyDown={onKeyDown}
              autoFocus
            />
            <input
              className={styles.inputSmall}
              type="text"
              placeholder="A guiding question (e.g. How are harmonics related to orbital mechanics?)"
              value={question}
              onChange={(e) => onQuestionChange(e.target.value)}
              onKeyDown={onKeyDown}
            />
            <div className={styles.formHint}>
              The question shapes the AI tutor's research and opening response
            </div>
            <div className={styles.formActions}>
              <button className={styles.formButton} onClick={onHideForm}>
                cancel
              </button>
              <button
                className={styles.formButtonPrimary}
                onClick={onCreate}
                disabled={!title.trim()}
              >
                begin
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
