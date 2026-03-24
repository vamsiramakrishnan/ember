/**
 * ChipPreviewBar — compact preview of @mentions and /commands present in text.
 * Shown below the textarea as a quiet reference strip, not an overlay.
 * This avoids the cursor-mismatch bugs caused by overlaying chips on a textarea.
 */
import { useMemo } from 'react';
import { MentionChip, parseMentions } from '@/primitives/MentionChip';
import { SlashChip } from '@/primitives/SlashChip';
import styles from './ChipPreviewBar.module.css';

const SLASH_RE = /\/(?:draw|visualize|research|explain|summarize|quiz|timeline|connect|define|teach|podcast|flashcards|exercise)\b/g;

interface ChipPreviewBarProps {
  value: string;
}

export function ChipPreviewBar({ value }: ChipPreviewBarProps) {
  const chips = useMemo(() => {
    const mentions = parseMentions(value);
    const slashMatches: string[] = [];
    let m;
    const re = new RegExp(SLASH_RE.source, 'g');
    while ((m = re.exec(value)) !== null) {
      slashMatches.push(m[0].slice(1));
    }
    return { mentions, slashMatches };
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
      {chips.slashMatches.map((cmd, i) => (
        <SlashChip key={`s${i}`} command={cmd} />
      ))}
    </div>
  );
}
