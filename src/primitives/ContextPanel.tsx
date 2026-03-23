/**
 * ContextPanel — shared primitive for all contextual interaction surfaces.
 * Post-spec extension: not in the original component inventory (06).
 * Added to provide a standardised popup/popover foundation used by
 * SelectionToolbar, BlockInserter, MentionPopup, and SlashCommandPopup.
 * Handles surface treatment, reveal animation, keyboard dismiss (Escape),
 * and click-outside close.
 * Related: 02-visual-language.md (material, motion tokens),
 *          01-design-principles.md (quiet interface, peripheral visibility)
 *
 * Usage:
 *   <ContextPanel reveal="up" onDismiss={close} zIndex={20}>
 *     ...menu content...
 *   </ContextPanel>
 */
import { useEffect, useRef, type ReactNode, type CSSProperties } from 'react';
import styles from './ContextPanel.module.css';

type Reveal = 'up' | 'down' | 'right' | 'inline';

interface ContextPanelProps {
  children: ReactNode;
  /** Animation direction for reveal. */
  reveal?: Reveal;
  /** Callback when the panel should close (Escape, click outside). */
  onDismiss?: () => void;
  /** z-index tier: inline=5, margin=10, floating=20, overlay=30. */
  zIndex?: number;
  /** Additional className for positioning. */
  className?: string;
  /** Inline style overrides (for position coords). */
  style?: CSSProperties;
  /** ARIA role override. Defaults to "dialog". */
  role?: string;
  /** ARIA label. */
  ariaLabel?: string;
  /** If true, skip the surface border/background (e.g. for inline panels). */
  bare?: boolean;
}

const REVEAL_MAP: Record<Reveal, string | undefined> = {
  up: styles.revealUp,
  down: styles.revealDown,
  right: styles.revealRight,
  inline: styles.revealInline,
};

export function ContextPanel({
  children, reveal = 'up', onDismiss, zIndex = 20,
  className, style, role = 'dialog', ariaLabel, bare,
}: ContextPanelProps) {
  const ref = useRef<HTMLDivElement>(null);

  // Escape to dismiss
  useEffect(() => {
    if (!onDismiss) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onDismiss(); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onDismiss]);

  // Click outside to dismiss
  useEffect(() => {
    if (!onDismiss) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onDismiss();
      }
    };
    // Delay to avoid catching the opening click
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', onClick);
    }, 10);
    return () => { clearTimeout(timer); document.removeEventListener('mousedown', onClick); };
  }, [onDismiss]);

  const revealCls = REVEAL_MAP[reveal] ?? '';
  const surfaceCls = bare ? '' : styles.surface;
  const cls = [surfaceCls, revealCls, className].filter(Boolean).join(' ');

  return (
    <div ref={ref} className={cls} style={{ ...style, zIndex }}
      role={role} aria-label={ariaLabel}>
      {children}
    </div>
  );
}

/** Re-export CSS module classes for composing in other CSS modules. */
export { styles as contextPanelStyles };
