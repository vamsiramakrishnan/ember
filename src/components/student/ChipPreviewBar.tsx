/**
 * ChipPreviewBar — shows the command pipeline below the textarea.
 *
 * When multiple slash commands are present, renders them as a visual
 * flow with arrows: `/research → /slides` — showing the student
 * that their commands will chain together.
 *
 * Also shows @mention chips in the same bar.
 */
import { useMemo } from 'react';
import { MentionChip, parseMentions } from '@/primitives/MentionChip';
import { SlashChip } from '@/primitives/SlashChip';
import { SLASH_COMMAND_PATTERN, COMMAND_MAP } from './slash-commands';
import styles from './ChipPreviewBar.module.css';

const SLASH_RE = new RegExp(`\\/(?:${SLASH_COMMAND_PATTERN})\\b`, 'g');

interface ChipPreviewBarProps {
  value: string;
}

export function ChipPreviewBar({ value }: ChipPreviewBarProps) {
  const chips = useMemo(() => {
    const mentions = parseMentions(value);
    const slashMatches: string[] = [];
    const re = new RegExp(SLASH_RE.source, 'g');
    let m;
    while ((m = re.exec(value)) !== null) {
      slashMatches.push(m[0].slice(1));
    }

    // Sort: actions first, then formats — to show the pipeline flow
    const actions: string[] = [];
    const formats: string[] = [];
    const other: string[] = [];
    for (const cmd of slashMatches) {
      const def = COMMAND_MAP.get(cmd);
      if (def?.role === 'action') actions.push(cmd);
      else if (def?.role === 'format') formats.push(cmd);
      else other.push(cmd);
    }
    const ordered = [...actions, ...formats, ...other];

    return { mentions, slashMatches: ordered, hasChain: actions.length > 0 && formats.length > 0 };
  }, [value]);

  if (chips.mentions.length === 0 && chips.slashMatches.length === 0) return null;

  return (
    <div className={styles.bar} aria-label="References in your message">
      {chips.mentions.map((m, i) => (
        <MentionChip
          key={`m${i}`}
          name={m.name}
          entityType={m.entityType}
          entityId={m.entityId}
        />
      ))}
      {chips.slashMatches.map((cmd, i) => {
        const isLast = i === chips.slashMatches.length - 1;
        const showArrow = chips.hasChain && !isLast;
        return (
          <span key={`s${i}`} className={styles.chipWithFlow}>
            <SlashChip command={cmd} />
            {showArrow && <span className={styles.flowArrow} aria-hidden="true">→</span>}
          </span>
        );
      })}
    </div>
  );
}
