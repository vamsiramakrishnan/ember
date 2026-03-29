/**
 * SlashChip — inline /command rendered as a warm pill within sentences.
 *
 * Design: a quiet directive badge that flows in text like a warm word.
 * The chip signals "this is an action" without breaking reading flow.
 *
 * Three states:
 *   Rest: accent-tinted background, subtle border, system font
 *   Hover: background deepens, hint fades in via CSS (no layout shift)
 *   Active: pulsing border while the command is being executed
 *
 * The icon, colour, and label adapt to the command's semantic group:
 *   explore: indigo (inquiry)
 *   create: sage (growth)
 *   reflect: amber (connection)
 */
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
  group: 'explore' | 'create' | 'reflect' | 'workflow' | 'output';
}

const COMMAND_META: Record<string, CommandMeta> = {
  explain: { icon: '◇', hint: 'unpack in depth', group: 'explore' },
  research: { icon: '◈', hint: 'search and synthesize', group: 'explore' },
  define: { icon: '≡', hint: 'add to lexicon', group: 'explore' },
  visualize: { icon: '◉', hint: 'map as diagram', group: 'create' },
  draw: { icon: '✎', hint: 'sketch by hand', group: 'create' },
  timeline: { icon: '→', hint: 'trace through time', group: 'create' },
  connect: { icon: '⟷', hint: 'bridge ideas', group: 'create' },
  teach: { icon: '▣', hint: 'walk through', group: 'create' },
  podcast: { icon: '♪', hint: 'discuss aloud', group: 'create' },
  flashcards: { icon: '▤', hint: 'drill with cards', group: 'reflect' },
  exercise: { icon: '△', hint: 'guided practice', group: 'reflect' },
  quiz: { icon: '?', hint: 'test yourself', group: 'reflect' },
  summarize: { icon: '≡', hint: 'distill key ideas', group: 'reflect' },
  delve: { icon: '◆', hint: 'research → explain → map', group: 'workflow' },
  study: { icon: '◎', hint: 'cards → practice → test', group: 'workflow' },
  lesson: { icon: '▸', hint: 'teach → practice → test', group: 'workflow' },
  review: { icon: '↻', hint: 'summarize → cards', group: 'workflow' },
  compare: { icon: '⇌', hint: 'contrast → connect → map', group: 'workflow' },
  origins: { icon: '⊙', hint: 'timeline → research → teach', group: 'workflow' },
  illustrate: { icon: '◐', hint: 'explain → sketch → define', group: 'workflow' },
  // Output format verbs — combinable with action commands
  slides: { icon: '▦', hint: 'present as slides', group: 'output' },
  doc: { icon: '▧', hint: 'export as document', group: 'output' },
  notes: { icon: '▪', hint: 'concise notes', group: 'output' },
  brief: { icon: '▫', hint: 'one-page summary', group: 'output' },
};

const GROUP_ACCENT: Record<string, string> = {
  explore: styles.accentIndigo ?? '',
  create: styles.accentSage ?? '',
  reflect: styles.accentAmber ?? '',
  workflow: styles.accentMargin ?? '',
  output: styles.accentSage ?? '',
};

export function SlashChip({ command, active, onClick }: SlashChipProps) {
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
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      title={meta.hint}
      data-hint={meta.hint}
    >
      <span className={styles.icon}>{meta.icon}</span>
      <span className={styles.label}>/{command}</span>
    </span>
  );
}
