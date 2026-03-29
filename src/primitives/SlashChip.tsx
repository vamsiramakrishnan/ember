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
 * Verb roles drive the accent:
 *   action (investigate): indigo
 *   format: sage
 *   workflow: margin
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
  role: 'action' | 'format' | 'workflow';
}

const COMMAND_META: Record<string, CommandMeta> = {
  // Action verbs (investigate)
  research: { icon: '◈', hint: 'search and synthesize', role: 'action' },
  explain: { icon: '◇', hint: 'unpack in depth', role: 'action' },
  define: { icon: '≡', hint: 'add to lexicon', role: 'action' },
  compare: { icon: '⇌', hint: 'contrast two ideas', role: 'action' },
  connect: { icon: '⟷', hint: 'bridge ideas', role: 'action' },
  summarize: { icon: '≡', hint: 'distill key ideas', role: 'action' },
  // Format verbs
  slides: { icon: '▦', hint: 'slide deck', role: 'format' },
  doc: { icon: '▧', hint: 'document', role: 'format' },
  notes: { icon: '▪', hint: 'concise notes', role: 'format' },
  brief: { icon: '▫', hint: 'one-page summary', role: 'format' },
  flashcards: { icon: '▤', hint: 'drill with cards', role: 'format' },
  quiz: { icon: '?', hint: 'test yourself', role: 'format' },
  exercise: { icon: '△', hint: 'guided practice', role: 'format' },
  podcast: { icon: '♪', hint: 'discuss aloud', role: 'format' },
  visualize: { icon: '◉', hint: 'concept diagram', role: 'format' },
  draw: { icon: '✎', hint: 'sketch by hand', role: 'format' },
  timeline: { icon: '→', hint: 'trace through time', role: 'format' },
  teach: { icon: '▣', hint: 'reading material', role: 'format' },
  // Workflow presets
  delve: { icon: '◆', hint: 'research → explain → map', role: 'workflow' },
  study: { icon: '◎', hint: 'teach → cards → quiz', role: 'workflow' },
  lesson: { icon: '▸', hint: 'research → slides → quiz', role: 'workflow' },
  review: { icon: '↻', hint: 'summarize → cards', role: 'workflow' },
  origins: { icon: '⊙', hint: 'timeline → research → teach', role: 'workflow' },
  illustrate: { icon: '◐', hint: 'explain → sketch → define', role: 'workflow' },
  deepen: { icon: '⊕', hint: 'enrich with depth', role: 'workflow' },
};

const ROLE_ACCENT: Record<string, string> = {
  action: styles.accentIndigo ?? '',
  format: styles.accentSage ?? '',
  workflow: styles.accentMargin ?? '',
};

export function SlashChip({ command, active, onClick }: SlashChipProps) {
  const meta = COMMAND_META[command] ?? { icon: '/', hint: command, role: 'action' };
  const accent = ROLE_ACCENT[meta.role] ?? '';

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
