/**
 * EmbedEntry — renders URLs with media-aware previews.
 * Detects YouTube/Vimeo → inline video player.
 * Detects PDF links → iframe preview thumbnail.
 * Everything else → quiet bookmark card.
 */
import styles from './EmbedEntry.module.css';

interface EmbedEntryProps {
  url: string;
  title?: string;
  description?: string;
  favicon?: string;
}

function getDomain(url: string): string {
  try { return new URL(url).hostname.replace('www.', ''); }
  catch { return url; }
}

function getYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/);
  return m?.[1] ?? null;
}

function getVimeoId(url: string): string | null {
  const m = url.match(/vimeo\.com\/(\d+)/);
  return m?.[1] ?? null;
}

function isPdfUrl(url: string): boolean {
  return url.toLowerCase().endsWith('.pdf') || url.includes('/pdf/');
}

export function EmbedEntry({ url, title, description, favicon }: EmbedEntryProps) {
  const ytId = getYouTubeId(url);
  const vimeoId = getVimeoId(url);

  // YouTube
  if (ytId) {
    return (
      <div className={styles.videoWrap}>
        <iframe
          className={styles.video}
          src={`https://www.youtube-nocookie.com/embed/${ytId}`}
          title={title ?? 'Video'}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
          allowFullScreen
        />
        {title && <span className={styles.videoTitle}>{title}</span>}
      </div>
    );
  }

  // Vimeo
  if (vimeoId) {
    return (
      <div className={styles.videoWrap}>
        <iframe
          className={styles.video}
          src={`https://player.vimeo.com/video/${vimeoId}?dnt=1`}
          title={title ?? 'Video'}
          allow="autoplay; fullscreen"
          allowFullScreen
        />
        {title && <span className={styles.videoTitle}>{title}</span>}
      </div>
    );
  }

  // PDF
  if (isPdfUrl(url)) {
    return (
      <div className={styles.pdfWrap}>
        <iframe
          className={styles.pdfPreview}
          src={url}
          title={title ?? 'PDF document'}
        />
        <a className={styles.pdfLink} href={url} target="_blank" rel="noopener noreferrer">
          {title ?? getDomain(url)} — open PDF
        </a>
      </div>
    );
  }

  // Default: bookmark card
  return (
    <a className={styles.embed} href={url} target="_blank" rel="noopener noreferrer">
      {favicon && <img className={styles.favicon} src={favicon} alt="" width={16} height={16} />}
      <div className={styles.content}>
        <span className={styles.title}>{title ?? getDomain(url)}</span>
        {description && <span className={styles.description}>{description}</span>}
        <span className={styles.domain}>{getDomain(url)}</span>
      </div>
    </a>
  );
}
