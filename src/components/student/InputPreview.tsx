/**
 * InputPreview — visual overlay that renders @ mentions and / commands
 * as styled chips on top of the raw textarea text.
 *
 * The textarea holds the raw syntax (@[name](type:id), /command).
 * This overlay mirrors the textarea layout but renders those tokens
 * as warm inline chips, making the input feel polished.
 */
import { useMemo } from 'react';
import { MentionChip, MENTION_PATTERN } from '@/primitives/MentionChip';
import { SlashChip } from '@/primitives/SlashChip';
import type { EntityType } from '@/hooks/useEntityIndex';
import styles from './InputPreview.module.css';

interface InputPreviewProps {
  value: string;
  visible: boolean;
}

/** All recognized /commands — kept in sync with SlashCommandPopup. */
const SLASH_COMMANDS = 'draw|visualize|research|explain|summarize|quiz|timeline|connect|define|teach|podcast|flashcards|exercise|delve|study|lesson';

interface Segment {
  type: 'text' | 'mention' | 'slash';
  value: string;
  entityType?: EntityType;
  entityId?: string;
}

function tokenize(text: string): Segment[] {
  const segments: Segment[] = [];

  // Combined regex: @mentions OR /commands
  const mentionSrc = MENTION_PATTERN.source;
  const slashSrc = `(?:^|\\s)(\\/(?:${SLASH_COMMANDS}))(?=\\s|$)`;
  const combined = new RegExp(`${mentionSrc}|${slashSrc}`, 'g');

  let lastIdx = 0;
  let match;

  while ((match = combined.exec(text)) !== null) {
    if (match[1] != null) {
      // Mention match — groups 1 (name), 2 (type), 3 (id)
      if (match.index > lastIdx) {
        segments.push({ type: 'text', value: text.slice(lastIdx, match.index) });
      }
      segments.push({
        type: 'mention',
        value: match[1],
        entityType: (match[2] ?? 'concept') as EntityType,
        entityId: match[3] ?? '',
      });
      lastIdx = match.index + match[0].length;
    } else if (match[4] != null) {
      // Slash match — group 4, may have leading whitespace
      const cmdStart = match[0].indexOf('/');
      const absStart = match.index + cmdStart;
      if (absStart > lastIdx) {
        segments.push({ type: 'text', value: text.slice(lastIdx, absStart) });
      }
      segments.push({ type: 'slash', value: match[4] });
      lastIdx = absStart + match[4].length;
    }
  }

  if (lastIdx < text.length) {
    segments.push({ type: 'text', value: text.slice(lastIdx) });
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
            <MentionChip
              key={i}
              name={seg.value}
              entityType={seg.entityType ?? 'concept'}
              entityId={seg.entityId ?? ''}
            />
          );
        }
        if (seg.type === 'slash') {
          const cmd = seg.value.startsWith('/') ? seg.value.slice(1) : seg.value;
          return <SlashChip key={i} command={cmd} />;
        }
        return <span key={i}>{seg.value}</span>;
      })}
    </div>
  );
}
