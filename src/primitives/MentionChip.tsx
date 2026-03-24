/**
 * MentionChip — renders an inline @mention as a styled chip.
 * Stored in entry content as @[name](type:id).
 * Rendered as a warm, quiet inline reference with optional meta label.
 *
 * Enhanced mode: when ChipContext provides a resolver, hovering shows
 * a preview card with entity details, mastery, and cross-references.
 */
import { useState, useRef, useCallback } from 'react';
import type { EntityType } from '@/hooks/useEntityIndex';
import { useChipContext, type EntityPreview } from './ChipContext';
import { ChipPreviewCard } from './ChipPreviewCard';
import styles from './MentionChip.module.css';

interface MentionChipProps {
  name: string;
  entityType: EntityType;
  entityId: string;
  meta?: string;
  onClick?: () => void;
}

const TYPE_PREFIX: Record<EntityType, string> = {
  notebook: '◉', session: '§', thinker: '◈', concept: '◇', term: '≡',
  text: '▤', question: '?', entry: '¶', slide: '▸', card: '⬡',
  exercise: '◆', code: '⟨⟩', diagram: '⊞', image: '▣', file: '⎙',
  'tutor-note': '✎', podcast: '♪',
};

const TYPE_ACCENT: Partial<Record<EntityType, string>> = {
  thinker: styles.accentAmber ?? '', concept: styles.accentIndigo ?? '',
  term: styles.accentSage ?? '', slide: styles.accentIndigo ?? '',
  card: styles.accentSage ?? '', exercise: styles.accentAmber ?? '',
  code: styles.accentMono ?? '', diagram: styles.accentIndigo ?? '',
  podcast: styles.accentSage ?? '',
};

const HOVER_DELAY = 300;

export function MentionChip({ name, entityType, entityId, meta, onClick }: MentionChipProps) {
  const { resolveEntity } = useChipContext();
  const [preview, setPreview] = useState<EntityPreview | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onEnter = useCallback(() => {
    if (!resolveEntity) return;
    hoverTimer.current = setTimeout(() => {
      const data = resolveEntity(entityType, entityId);
      if (data) { setPreview(data); setShowPreview(true); }
    }, HOVER_DELAY);
  }, [resolveEntity, entityType, entityId]);

  const onLeave = useCallback(() => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    setShowPreview(false);
  }, []);

  const isStub = entityId.startsWith('stub-');
  const accent = TYPE_ACCENT[entityType] ?? '';
  const cls = [styles.chip, accent, onClick ? styles.clickable : '', isStub ? styles.enriching : '']
    .filter(Boolean).join(' ');
  return (
    <span
      className={cls}
      onClick={onClick} role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onMouseEnter={onEnter} onMouseLeave={onLeave}
    >
      <span className={styles.prefix}>{TYPE_PREFIX[entityType] ?? '@'}</span>
      <span className={styles.name}>{name}</span>
      {meta && <span className={styles.meta}>{meta}</span>}
      {showPreview && preview && <ChipPreviewCard data={preview} />}
    </span>
  );
}

/** Parse @mentions from text content. */
export const MENTION_PATTERN = /@\[([^\]]+)\]\(([^:]+):([^)]+)\)/g;

export function parseMentions(text: string): Array<{
  fullMatch: string; name: string; entityType: EntityType;
  entityId: string; index: number;
}> {
  const mentions: typeof results = [];
  type Result = { fullMatch: string; name: string; entityType: EntityType; entityId: string; index: number };
  const results: Result[] = mentions;
  const regex = new RegExp(MENTION_PATTERN.source, 'g');
  let match;
  while ((match = regex.exec(text)) !== null) {
    mentions.push({
      fullMatch: match[0], name: match[1] ?? '',
      entityType: (match[2] ?? 'concept') as EntityType,
      entityId: match[3] ?? '', index: match.index,
    });
  }
  return mentions;
}

/** Create mention syntax for insertion into text. */
export function createMentionSyntax(
  name: string, type: EntityType, id: string,
): string {
  return `@[${name}](${type}:${id})`;
}
