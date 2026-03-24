/**
 * SlashChip — inline /command rendered as a warm pill within sentences.
 *
 * Design: a quiet directive badge that flows in text like a warm word.
 * The chip signals "this is an action" without breaking reading flow.
 *
 * Three states:
 *   Rest: indigo-dim background, subtle border, system font
 *   Hover: background deepens, tooltip shows command description
 *   Active: pulsing border while the command is being executed
 *
 * The icon, colour, and label adapt to the command's semantic group:
 *   explore: indigo (inquiry)
 *   create: sage (growth)
 *   reflect: amber (connection)
 */
import { useState } from 'react';
import styles from './SlashChip.module.css';

export interface SlashChipProps {
  command: string;
  /** Whether this command is currently being executed by the DAG. */
  active?: boolean;
  onClick?: () => void;
}

interface CommandMeta {
  icon: string;
  hint: string;
  group: 'explore' | 'create' | 'reflect';
}

const COMMAND_META: Record<string, CommandMeta> = {
  explain: { icon: '◇', hint: 'explain in depth', group: 'explore' },
  research: { icon: '◈', hint: 'deep-dive with search', group: 'explore' },
  define: { icon: '≡', hint: 'add to lexicon', group: 'explore' },
  visualize: { icon: '◉', hint: 'concept diagram', group: 'create' },
  draw: { icon: '✎', hint: 'hand-drawn sketch', group: 'create' },
  timeline: { icon: '→', hint: 'historical progression', group: 'create' },
  connect: { icon: '⟷', hint: 'bridge ideas', group: 'create' },
  teach: { icon: '▣', hint: 'reading material', group: 'create' },
  podcast: { icon: '♪', hint: 'audio discussion', group: 'create' },
  flashcards: { icon: '◈', hint: 'study cards', group: 'reflect' },
  exercise: { icon: '◇', hint: 'practice problems', group: 'reflect' },
  quiz: { icon: '?', hint: 'test understanding', group: 'reflect' },
  summarize: { icon: '≡', hint: 'distill session', group: 'reflect' },
};

const GROUP_ACCENT: Record<string, string> = {
  explore: styles.accentIndigo ?? '',
  create: styles.accentSage ?? '',
  reflect: styles.accentAmber ?? '',
};

export function SlashChip({ command, active, onClick }: SlashChipProps) {
  const [hovered, setHovered] = useState(false);
  const meta = COMMAND_META[command] ?? { icon: '/', hint: command, group: 'explore' };
  const accent = GROUP_ACCENT[meta.group] ?? '';

  const cls = [
    styles.chip,
    accent,
    active ? styles.active : '',
    onClick ? styles.clickable : '',
  ].filter(Boolean).join(' ');

  return (
    <span
      className={cls}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      title={meta.hint}
    >
      <span className={styles.icon}>{meta.icon}</span>
      <span className={styles.label}>/{command}</span>
      {hovered && <span className={styles.hint}>{meta.hint}</span>}
    </span>
  );
}
