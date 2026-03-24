/**
 * useEntryKeyboardNav — keyboard navigation between notebook entries.
 *
 * Interaction model:
 * - Alt+↓ / Alt+↑: move focus to next/previous entry
 * - Alt+Home: jump to first entry
 * - Alt+End: jump to last entry (InputZone)
 * - The focused entry receives a subtle highlight ring
 *
 * This hook is attached to the entry container, not individual entries,
 * to avoid N event listeners. Uses data-entry-id attributes for targeting.
 */
import { useCallback, useRef } from 'react';

export function useEntryKeyboardNav() {
  const containerRef = useRef<HTMLDivElement>(null);
  const focusedIdx = useRef(-1);

  const getEntries = useCallback((): HTMLElement[] => {
    if (!containerRef.current) return [];
    return Array.from(
      containerRef.current.querySelectorAll<HTMLElement>('[data-entry-id]')
    );
  }, []);

  const focusEntry = useCallback((entries: HTMLElement[], idx: number) => {
    if (idx < 0 || idx >= entries.length) return;
    const el = entries[idx];
    if (!el) return;
    focusedIdx.current = idx;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.focus({ preventScroll: true });
    // Add a transient focus class
    el.classList.add('kb-focused');
    setTimeout(() => el.classList.remove('kb-focused'), 2000);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!e.altKey) return;
    const entries = getEntries();
    if (entries.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = Math.min(focusedIdx.current + 1, entries.length - 1);
      focusEntry(entries, next);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = Math.max(focusedIdx.current - 1, 0);
      focusEntry(entries, prev);
    } else if (e.key === 'Home') {
      e.preventDefault();
      focusEntry(entries, 0);
    } else if (e.key === 'End') {
      e.preventDefault();
      focusEntry(entries, entries.length - 1);
    }
  }, [getEntries, focusEntry]);

  return { containerRef, handleKeyDown };
}
