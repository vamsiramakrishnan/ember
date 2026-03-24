/** Slash command definitions — shared by SlashCommandPopup and InputPreview.
 * Four semantic groups: explore (indigo), create (sage), reflect (amber), workflow (margin). */
import styles from './MentionPopup.module.css';

export interface SlashCommand {
  id: string;
  label: string;
  hint: string;
  icon: string;
  accent: string;
  group: string;
}

const s = (c: string | undefined) => c ?? '';

export const COMMANDS: SlashCommand[] = [
  /* ── explore (indigo): inquiry and discovery ────────── */
  { id: 'explain', label: 'explain', hint: 'unpack a concept in depth', icon: '◇', accent: s(styles.iconIndigo), group: 'explore' },
  { id: 'research', label: 'research', hint: 'search and synthesize sources', icon: '◈', accent: s(styles.iconIndigo), group: 'explore' },
  { id: 'define', label: 'define', hint: 'add a term to your lexicon', icon: '≡', accent: s(styles.iconIndigo), group: 'explore' },
  /* ── create (sage): generation and synthesis ────────── */
  { id: 'visualize', label: 'visualize', hint: 'map relationships as a diagram', icon: '◉', accent: s(styles.iconSage), group: 'create' },
  { id: 'draw', label: 'draw', hint: 'sketch a concept by hand', icon: '✎', accent: s(styles.iconSage), group: 'create' },
  { id: 'timeline', label: 'timeline', hint: 'trace a progression through time', icon: '→', accent: s(styles.iconSage), group: 'create' },
  { id: 'connect', label: 'connect', hint: 'find bridges between ideas', icon: '⟷', accent: s(styles.iconSage), group: 'create' },
  { id: 'teach', label: 'teach', hint: 'walk through a concept step by step', icon: '▣', accent: s(styles.iconSage), group: 'create' },
  { id: 'podcast', label: 'podcast', hint: 'hear a topic discussed aloud', icon: '♪', accent: s(styles.iconSage), group: 'create' },
  /* ── reflect (amber): consolidation and recall ──────── */
  { id: 'flashcards', label: 'flashcards', hint: 'drill with spaced-recall cards', icon: '▤', accent: s(styles.iconAmber), group: 'reflect' },
  { id: 'exercise', label: 'exercise', hint: 'practice with guided problems', icon: '△', accent: s(styles.iconAmber), group: 'reflect' },
  { id: 'quiz', label: 'quiz', hint: 'test your understanding', icon: '?', accent: s(styles.iconAmber), group: 'reflect' },
  { id: 'summarize', label: 'summarize', hint: 'distill the key ideas so far', icon: '≡', accent: s(styles.iconAmber), group: 'reflect' },
  /* ── workflow (margin): multi-step learning arcs ────── */
  { id: 'delve', label: 'delve', hint: 'research, explain, then map', icon: '◆', accent: s(styles.iconMargin), group: 'workflow' },
  { id: 'study', label: 'study', hint: 'cards, exercises, then test', icon: '◎', accent: s(styles.iconMargin), group: 'workflow' },
  { id: 'lesson', label: 'lesson', hint: 'teach, practice, then test', icon: '▸', accent: s(styles.iconMargin), group: 'workflow' },
  { id: 'review', label: 'review', hint: 'summarize, then make cards', icon: '↻', accent: s(styles.iconMargin), group: 'workflow' },
  { id: 'compare', label: 'compare', hint: 'contrast two ideas side by side', icon: '⇌', accent: s(styles.iconMargin), group: 'workflow' },
  { id: 'origins', label: 'origins', hint: 'trace the intellectual history', icon: '⊙', accent: s(styles.iconMargin), group: 'workflow' },
  { id: 'illustrate', label: 'illustrate', hint: 'explain, sketch, then define', icon: '◐', accent: s(styles.iconMargin), group: 'workflow' },
];

export const GROUP_LABELS: Record<string, string> = {
  explore: 'explore', create: 'create', reflect: 'reflect', workflow: 'workflow',
};

/** Pipe-separated list for regex matching in InputPreview. */
export const SLASH_COMMAND_PATTERN = COMMANDS.map((c) => c.id).join('|');
