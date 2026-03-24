/**
 * ThreadLink — subtle relation indicator on entries with follow-up chains.
 * Clicking highlights connected entries and scrolls to the first one.
 * Shows "↳ N follow-ups" or "↱ responds to" depending on direction.
 */
import { useState, useCallback, useEffect } from 'react';
import { getFollowUps, getPrompters } from '@/state/entry-graph';
import styles from './ThreadLink.module.css';

interface ThreadLinkProps {
  entryId: string;
}

const HIGHLIGHT_CLASS = 'thread-highlight';
const HIGHLIGHT_DURATION = 3000;

export function ThreadLink({ entryId }: ThreadLinkProps) {
  const [followUps, setFollowUps] = useState<string[]>([]);
  const [prompters, setPrompters] = useState<string[]>([]);

  useEffect(() => {
    setFollowUps(getFollowUps(entryId).map((r) => r.to));
    setPrompters(getPrompters(entryId).map((r) => r.to));
  }, [entryId]);

  const handleClick = useCallback((targetIds: string[]) => {
    // Remove any existing highlights
    document.querySelectorAll(`.${HIGHLIGHT_CLASS}`).forEach((el) =>
      el.classList.remove(HIGHLIGHT_CLASS));

    // Highlight connected entries
    for (const id of targetIds) {
      const el = document.querySelector(`[data-entry-id="${id}"]`);
      if (el) el.classList.add(HIGHLIGHT_CLASS);
    }

    // Scroll to first connected entry
    const firstEl = targetIds[0]
      ? document.querySelector(`[data-entry-id="${targetIds[0]}"]`)
      : null;
    firstEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Clear highlights after duration
    setTimeout(() => {
      document.querySelectorAll(`.${HIGHLIGHT_CLASS}`).forEach((el) =>
        el.classList.remove(HIGHLIGHT_CLASS));
    }, HIGHLIGHT_DURATION);
  }, []);

  if (followUps.length === 0 && prompters.length === 0) return null;

  return (
    <div className={styles.container}>
      {followUps.length > 0 && (
        <button
          className={styles.link}
          onClick={() => handleClick(followUps)}
          type="button"
          aria-label={`${followUps.length} follow-up${followUps.length > 1 ? 's' : ''}`}
        >
          <span className={styles.arrow}>↳</span>
          <span className={styles.count}>{followUps.length}</span>
        </button>
      )}
      {prompters.length > 0 && (
        <button
          className={styles.link}
          onClick={() => handleClick(prompters)}
          type="button"
          aria-label="Scroll to prompt"
        >
          <span className={styles.arrow}>↱</span>
        </button>
      )}
    </div>
  );
}
