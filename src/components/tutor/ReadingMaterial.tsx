/**
 * ReadingMaterial — paginated teaching slide deck with progressive disclosure.
 * Post-spec extension: not in the original component inventory (06).
 * Added to support the /teach slash command's structured reading material output.
 * Three view levels: thumbnail → expanded paginated view → full-screen modal.
 * AI-generated block — produced by /teach slash command.
 * Related: 03-interaction-language.md (tutor voice, pacing),
 *          04-information-architecture.md (notebook surface)
 */
import { useState, useCallback } from 'react';
import { Lightbox } from '@/primitives/Lightbox';
import { ReadingSlideView } from './ReadingSlideView';
import { exportToPptx } from '@/services/reading-material-export';
import { exportToDocx } from '@/services/docx-export';
import type { ReadingSlide } from '@/types/entries';
import styles from './ReadingMaterial.module.css';

interface ReadingMaterialProps {
  title: string;
  subtitle?: string;
  slides: ReadingSlide[];
  coverUrl?: string;
}

type ViewLevel = 'thumbnail' | 'expanded' | 'modal';

export function ReadingMaterial({ title, subtitle, slides, coverUrl }: ReadingMaterialProps) {
  const [level, setLevel] = useState<ViewLevel>('thumbnail');
  const [page, setPage] = useState(0);
  const [exporting, setExporting] = useState(false);

  const total = slides.length;
  const prev = useCallback(() => setPage((p) => Math.max(0, p - 1)), []);
  const next = useCallback(() => setPage((p) => Math.min(total - 1, p + 1)), [total]);
  const expand = useCallback(() => setLevel('expanded'), []);
  const collapse = useCallback(() => setLevel('thumbnail'), []);
  const openModal = useCallback(() => setLevel('modal'), []);
  const closeModal = useCallback(() => setLevel('expanded'), []);

  const handleExportPptx = useCallback(async () => {
    setExporting(true);
    try { await exportToPptx(title, subtitle, slides); }
    finally { setExporting(false); }
  }, [title, subtitle, slides]);

  const handleExportDocx = useCallback(async () => {
    setExporting(true);
    try { await exportToDocx(title, subtitle, slides); }
    finally { setExporting(false); }
  }, [title, subtitle, slides]);

  const isThumb = level === 'thumbnail';

  const slideContent = (
    <div className={styles.slideArea}>
      {slides[page] && <ReadingSlideView slide={slides[page]} index={page} />}
      <SlideNav page={page} total={total} onPrev={prev} onNext={next} />
    </div>
  );

  return (
    <>
      <div className={`${styles.container} ${!isThumb ? styles.expanded : ''}`}>
        {/* Header */}
        <div className={styles.header}
          onClick={isThumb ? expand : undefined}
          role={isThumb ? 'button' : undefined}
          tabIndex={isThumb ? 0 : undefined}
          aria-label={isThumb ? 'Expand reading material' : undefined}
          onKeyDown={isThumb ? (e) => { if (e.key === 'Enter') expand(); } : undefined}>
          <div className={styles.titleRow}>
            {coverUrl ? (
              <img className={styles.coverArt} src={coverUrl}
                alt={`Cover for ${title}`} loading="lazy" />
            ) : (
              <span className={styles.icon}>◈</span>
            )}
            <div className={styles.titles}>
              <h3 className={styles.title}>{title}</h3>
              {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
            </div>
            <span className={styles.badge}>{total} pages</span>
          </div>
          {isThumb && <p className={styles.thumbHint}>click to read</p>}
        </div>

        {/* Expanded inline view */}
        {!isThumb && slideContent}

        {/* Toolbar */}
        {!isThumb && (
          <div className={styles.toolbar}>
            <button className={styles.actionBtn} onClick={handleExportPptx}
              disabled={exporting} aria-label="Download as PPTX">
              {exporting ? '…' : '↓ pptx'}
            </button>
            <button className={styles.actionBtn} onClick={handleExportDocx}
              disabled={exporting} aria-label="Download as DOCX">
              {exporting ? '…' : '↓ docx'}
            </button>
            <button className={styles.actionBtn} onClick={openModal}
              aria-label="Open full view">↗ full view</button>
            <button className={styles.actionBtn} onClick={collapse}
              aria-label="Collapse">↙ collapse</button>
          </div>
        )}
      </div>

      {/* Modal lightbox */}
      <Lightbox open={level === 'modal'} onClose={closeModal}>
        <div className={styles.modalContent}>
          <div className={styles.modalHeader}>
            <h2 className={styles.modalTitle}>{title}</h2>
            {subtitle && <p className={styles.modalSubtitle}>{subtitle}</p>}
          </div>
          {slideContent}
        </div>
      </Lightbox>
    </>
  );
}

/** Pagination controls */
function SlideNav({ page, total, onPrev, onNext }: {
  page: number; total: number; onPrev: () => void; onNext: () => void;
}) {
  return (
    <div className={styles.nav}>
      <button className={styles.navBtn} onClick={onPrev}
        disabled={page === 0} aria-label="Previous page">←</button>
      <span className={styles.pageIndicator}>{page + 1} / {total}</span>
      <button className={styles.navBtn} onClick={onNext}
        disabled={page === total - 1} aria-label="Next page">→</button>
    </div>
  );
}
