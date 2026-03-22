/**
 * MentionChip — renders an inline @mention as a styled chip.
 * Stored in entry content as @[name](type:id).
 * Rendered as a warm, quiet inline reference.
 */
import type { EntityType } from '@/hooks/useEntityIndex';
import styles from './MentionChip.module.css';

interface MentionChipProps {
  name: string;
  entityType: EntityType;
  entityId: string;
}

const TYPE_PREFIX: Record<EntityType, string> = {
  notebook: '◉',
  session: '§',
  thinker: '◈',
  concept: '◇',
  term: '≡',
  text: '▤',
  question: '?',
};

export function MentionChip({ name, entityType }: MentionChipProps) {
  return (
    <span className={styles.chip}>
      <span className={styles.prefix}>{TYPE_PREFIX[entityType] ?? '@'}</span>
      <span className={styles.name}>{name}</span>
    </span>
  );
}

/**
 * Parse @mentions from text content.
 * Format: @[display name](entity-type:entity-id)
 */
export const MENTION_PATTERN = /@\[([^\]]+)\]\(([^:]+):([^)]+)\)/g;

export function parseMentions(text: string): Array<{
  fullMatch: string;
  name: string;
  entityType: EntityType;
  entityId: string;
  index: number;
}> {
  const mentions: Array<{
    fullMatch: string;
    name: string;
    entityType: EntityType;
    entityId: string;
    index: number;
  }> = [];

  let match;
  const regex = new RegExp(MENTION_PATTERN.source, 'g');
  while ((match = regex.exec(text)) !== null) {
    mentions.push({
      fullMatch: match[0],
      name: match[1] ?? '',
      entityType: (match[2] ?? 'concept') as EntityType,
      entityId: match[3] ?? '',
      index: match.index,
    });
  }

  return mentions;
}

/**
 * Create mention syntax for insertion into text.
 */
export function createMentionSyntax(
  name: string, type: EntityType, id: string,
): string {
  return `@[${name}](${type}:${id})`;
}
