/**
 * ReadingMaterial — paginated teaching slide deck with progressive disclosure.
 * Post-spec extension: not in the original component inventory (06).
 * Three view levels: thumbnail → expanded paginated view → full-screen modal.
 * Supports iterative expansion (append more slides) and visual enrichment.
 */
import { useState, useCallback } from 'react';
import { Lightbox } from '@/primitives/Lightbox';
import { ReadingSlideView } from './ReadingSlideView';
import { DeckToolbar } from './DeckToolbar';
import type { ReadingSlide } from '@/types/entries';
import styles from './ReadingMaterial.module.css';

interface ReadingMaterialProps {
  title: string;
  subtitle?: string;
  slides: ReadingSlide[];
  coverUrl?: string;
  /** Callback to patch this entry with updated slides. */
  onPatch?: (slides: ReadingSlide[], coverUrl?: string) => void;
}

type ViewLevel = 'thumbnail' | 'expanded' | 'modal';

export function ReadingMaterial({
  title, subtitle, slides, coverUrl, onPatch,
}: ReadingMaterialProps) {
  const [level, setLevel] = useState<ViewLevel>('thumbnail');
  const [page, setPage] = useState(0);

  const total = slides.length;
  const prev = useCallback(() => setPage((p) => Math.max(0, p - 1)), []);
  const next = useCallback(() => setPage((p) => Math.min(total - 1, p + 1)), [total]);
  const expand = useCallback(() => setLevel('expanded'), []);
  const collapse = useCallback(() => setLevel('thumbnail'), []);
  const openModal = useCallback(() => setLevel('modal'), []);
  const closeModal = useCallback(() => setLevel('expanded'), []);

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

        {/* Toolbar with expand/export controls */}
        {!isThumb && (
          <DeckToolbar
            title={title} subtitle={subtitle} slides={slides}
            coverUrl={coverUrl} onPatch={onPatch}
            onOpenModal={openModal} onCollapse={collapse}
          />
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
