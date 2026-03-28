/**
 * DeckToolbar — controls for reading material decks.
 * Export (PPTX, DOCX), expand (append slides), illustrate (per-slide art),
 * and view controls. Extracted from ReadingMaterial for line-count discipline.
 */
import { useState, useCallback } from 'react';
import { exportToPptx } from '@/services/reading-material-export';
import { exportToDocx } from '@/services/docx-export';
import { expandDeck, type ExpansionDepth } from '@/services/deck-expander';
import { enrichSlideVisuals } from '@/services/slide-enrichment';
import type { ReadingSlide } from '@/types/entries';
import styles from './ReadingMaterial.module.css';

interface DeckToolbarProps {
  title: string;
  subtitle?: string;
  slides: ReadingSlide[];
  coverUrl?: string;
  onPatch?: (slides: ReadingSlide[], coverUrl?: string) => void;
  onOpenModal: () => void;
  onCollapse: () => void;
}

export function DeckToolbar({
  title, subtitle, slides, coverUrl, onPatch, onOpenModal, onCollapse,
}: DeckToolbarProps) {
  const [busy, setBusy] = useState<string | null>(null);

  const handleExport = useCallback(async (fmt: 'pptx' | 'docx') => {
    setBusy(fmt);
    try {
      if (fmt === 'pptx') await exportToPptx(title, subtitle, slides);
      else await exportToDocx(title, subtitle, slides);
    } finally { setBusy(null); }
  }, [title, subtitle, slides]);

  const handleExpand = useCallback(async (depth: ExpansionDepth) => {
    if (!onPatch) return;
    setBusy(`expand-${depth}`);
    try {
      const result = await expandDeck(
        { title, subtitle, slides, coverUrl },
        title, depth,
      );
      if (result && result.type === 'reading-material') {
        onPatch(result.slides, result.coverUrl);
      }
    } finally { setBusy(null); }
  }, [title, subtitle, slides, coverUrl, onPatch]);

  const handleIllustrate = useCallback(async () => {
    if (!onPatch) return;
    setBusy('illustrate');
    const updated = [...slides];
    await enrichSlideVisuals(slides, title, (idx, url) => {
      if (updated[idx]) {
        updated[idx] = { ...updated[idx], imageUrl: url };
        onPatch([...updated], coverUrl);
      }
    });
    setBusy(null);
  }, [slides, title, coverUrl, onPatch]);

  const isBusy = busy !== null;

  return (
    <div className={styles.toolbar}>
      {/* Export */}
      <button className={styles.actionBtn} onClick={() => handleExport('pptx')}
        disabled={isBusy} aria-label="Download as PPTX">
        {busy === 'pptx' ? '\u2026' : '\u2193 pptx'}
      </button>
      <button className={styles.actionBtn} onClick={() => handleExport('docx')}
        disabled={isBusy} aria-label="Download as DOCX">
        {busy === 'docx' ? '\u2026' : '\u2193 docx'}
      </button>

      <span className={styles.toolbarDivider} />

      {/* Expand — depth options */}
      {onPatch && (
        <>
          <button className={styles.actionBtn} onClick={() => handleExpand('brief')}
            disabled={isBusy} aria-label="Add 3 slides">
            {busy === 'expand-brief' ? '\u2026' : '+ brief'}
          </button>
          <button className={styles.actionBtn} onClick={() => handleExpand('standard')}
            disabled={isBusy} aria-label="Add 5 slides">
            {busy === 'expand-standard' ? '\u2026' : '+ expand'}
          </button>
          <button className={styles.actionBtn} onClick={() => handleExpand('deep')}
            disabled={isBusy} aria-label="Add 8 slides (deep dive)">
            {busy === 'expand-deep' ? '\u2026' : '+ deep dive'}
          </button>

          <span className={styles.toolbarDivider} />

          {/* Illustrate */}
          <button className={styles.actionBtn} onClick={handleIllustrate}
            disabled={isBusy} aria-label="Generate illustrations for slides">
            {busy === 'illustrate' ? '\u2026' : '\u270E illustrate'}
          </button>
        </>
      )}

      <span className={styles.toolbarDivider} />

      {/* View */}
      <button className={styles.actionBtn} onClick={onOpenModal}
        aria-label="Open full view">{'\u2197'} full view</button>
      <button className={styles.actionBtn} onClick={onCollapse}
        aria-label="Collapse">{'\u2199'} collapse</button>
    </div>
  );
}
