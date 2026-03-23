/**
 * Lightbox — full-viewport modal overlay rendered via portal.
 * Post-spec extension: not in the original component inventory (06).
 * Added to support deep-dive viewing of visualizations, reading materials,
 * and other content that benefits from full-screen immersion.
 * Warm paper backdrop, escape to close, scroll lock, focus trap.
 * Related: 02-visual-language.md (material, colour tokens),
 *          01-design-principles.md (focus, quiet interface)
 */
import { useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import styles from './Lightbox.module.css';

interface LightboxProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Optional label for the close button. */
  closeLabel?: string;
}

export function Lightbox({ open, onClose, children, closeLabel }: LightboxProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Escape key closes
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  // Focus trap: focus the container when opened
  useEffect(() => {
    if (open) containerRef.current?.focus();
  }, [open]);

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  }, [onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className={styles.backdrop}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label="Visualization detail"
    >
      <div className={styles.container} ref={containerRef} tabIndex={-1}>
        <div className={styles.content}>{children}</div>
        <button className={styles.close} onClick={onClose}
          aria-label="Close">
          {closeLabel ?? 'esc'}
        </button>
      </div>
    </div>,
    document.body,
  );
}
