/**
 * InputPreview — visual overlay that renders @ mentions and / commands
 * as styled chips on top of the raw textarea text.
 *
 * The textarea holds the raw syntax (@[name](type:id), /command).
 * This overlay mirrors the textarea layout but renders those tokens
 * as warm inline chips, making the input feel polished.
 */
import { useMemo } from 'react';
import { MENTION_PATTERN } from '@/primitives/MentionChip';
import type { EntityType } from '@/hooks/useEntityIndex';
import styles from './InputPreview.module.css';

interface InputPreviewProps {
  value: string;
  visible: boolean;
}

const SLASH_RE = /^(\/\w+)\s/;

const TYPE_ICONS: Record<string, string> = {
  notebook: '◉', session: '§', thinker: '◈', concept: '◇',
  term: '≡', text: '▤', question: '?',
};

interface Segment {
  type: 'text' | 'mention' | 'slash';
  value: string;
  icon?: string;
  entityType?: EntityType;
}

function tokenize(text: string): Segment[] {
  const segments: Segment[] = [];
  const regex = new RegExp(MENTION_PATTERN.source, 'g');
  let lastIdx = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIdx) {
      segments.push({ type: 'text', value: text.slice(lastIdx, match.index) });
    }
    const etype = (match[2] ?? 'concept') as EntityType;
    segments.push({
      type: 'mention',
      value: match[1] ?? '',
      icon: TYPE_ICONS[etype] ?? '@',
      entityType: etype,
    });
    lastIdx = match.index + match[0].length;
  }

  if (lastIdx < text.length) {
    const rest = text.slice(lastIdx);
    const slashMatch = lastIdx === 0 ? rest.match(SLASH_RE) : null;
    if (slashMatch) {
      segments.push({
        type: 'slash',
        value: slashMatch[1] ?? '',
      });
      segments.push({ type: 'text', value: rest.slice(slashMatch[0].length) });
    } else {
      segments.push({ type: 'text', value: rest });
    }
  }

  return segments;
}

export function InputPreview({ value, visible }: InputPreviewProps) {
  const segments = useMemo(() => tokenize(value), [value]);
  const hasMentionOrSlash = segments.some((s) => s.type !== 'text');

  if (!visible || !hasMentionOrSlash) return null;

  return (
    <div className={styles.overlay} aria-hidden="true">
      {segments.map((seg, i) => {
        if (seg.type === 'mention') {
          return (
            <span key={i} className={styles.mentionChip}>
              <span className={styles.chipIcon}>{seg.icon}</span>
              <span className={styles.chipName}>{seg.value}</span>
            </span>
          );
        }
        if (seg.type === 'slash') {
          return (
            <span key={i} className={styles.slashChip}>{seg.value}</span>
          );
        }
        return <span key={i}>{seg.value}</span>;
      })}
    </div>
  );
}
