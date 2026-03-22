/**
 * CodeCell — executable code block with syntax highlighting.
 * The notebook's computational surface. Student writes code,
 * Gemini executes it, results appear inline.
 *
 * Renders: source code with language tag + optional execution result.
 * Quiet aesthetic: no toolbar chrome, just code and output.
 */
import { useState, useCallback } from 'react';
import type { CodeResult } from '@/types/entries';
import styles from './CodeCell.module.css';

interface CodeCellProps {
  language: string;
  source: string;
  result?: CodeResult;
  onExecute?: (source: string, language: string) => void;
}

export function CodeCell({ language, source, result, onExecute }: CodeCellProps) {
  const [editing, setEditing] = useState(false);
  const [code, setCode] = useState(source);

  const handleRun = useCallback(() => {
    onExecute?.(code, language);
  }, [code, language, onExecute]);

  return (
    <div className={styles.cell}>
      <div className={styles.header}>
        <span className={styles.language}>{language}</span>
        {onExecute && (
          <button
            className={styles.runButton}
            onClick={handleRun}
            aria-label="Execute code"
          >
            run
          </button>
        )}
      </div>

      {editing ? (
        <textarea
          className={styles.editor}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onBlur={() => setEditing(false)}
          spellCheck={false}
          autoFocus
        />
      ) : (
        <pre
          className={styles.source}
          onClick={() => setEditing(true)}
          tabIndex={0}
          role="button"
          aria-label="Click to edit code"
        >
          <code>{source}</code>
        </pre>
      )}

      {result && (
        <div className={styles.output}>
          {result.stdout && (
            <pre className={styles.stdout}>{result.stdout}</pre>
          )}
          {result.stderr && (
            <pre className={styles.stderr}>{result.stderr}</pre>
          )}
        </div>
      )}
    </div>
  );
}
