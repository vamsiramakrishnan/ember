/**
 * Slash command definitions — the verb system.
 *
 * Mental model: students think in two dimensions:
 *   1. What do I want to know? → ACTION verbs (produce knowledge)
 *   2. How do I want it?       → FORMAT verbs (shape presentation)
 *
 * Any action composes with any format: `/research X /slides`
 * Format verbs alone imply a default action (teach).
 * Workflow verbs are preset chains of action+format combos.
 *
 * Verb roles:
 *   action  — investigates, generates, or tests knowledge
 *   format  — reshapes content into a specific output form
 *   workflow — preset multi-step chain (expands to action+format DAG)
 */
import styles from './MentionPopup.module.css';

/** Verb role: what kind of operation this command represents. */
export type VerbRole = 'action' | 'format' | 'workflow';

export interface SlashCommand {
  id: string;
  label: string;
  hint: string;
  icon: string;
  accent: string;
  group: string;
  /** Verb role for composition logic. */
  role: VerbRole;
  /** For workflows: the action chain this expands to. */
  expandsTo?: string[];
  /** Short composition hint shown when this verb is already selected. */
  composesWith?: string;
}

const s = (c: string | undefined) => c ?? '';

export const COMMANDS: SlashCommand[] = [
  /* ── action: investigate ───────────────────────────────── */
  { id: 'research', label: 'research', hint: 'search and synthesize sources', icon: '◈', accent: s(styles.iconIndigo), group: 'investigate', role: 'action', composesWith: 'add /slides, /doc, /notes, or /brief' },
  { id: 'explain', label: 'explain', hint: 'unpack a concept in depth', icon: '◇', accent: s(styles.iconIndigo), group: 'investigate', role: 'action', composesWith: 'add /slides, /doc, or /notes' },
  { id: 'define', label: 'define', hint: 'add a term to your lexicon', icon: '≡', accent: s(styles.iconIndigo), group: 'investigate', role: 'action' },
  { id: 'compare', label: 'compare', hint: 'contrast two ideas side by side', icon: '⇌', accent: s(styles.iconIndigo), group: 'investigate', role: 'action', composesWith: 'add /slides or /doc' },
  { id: 'connect', label: 'connect', hint: 'find bridges between ideas', icon: '⟷', accent: s(styles.iconIndigo), group: 'investigate', role: 'action' },
  { id: 'summarize', label: 'summarize', hint: 'distill the key ideas so far', icon: '≡', accent: s(styles.iconIndigo), group: 'investigate', role: 'action', composesWith: 'add /notes or /brief' },

  /* ── format: shape output ──────────────────────────────── */
  { id: 'slides', label: 'slides', hint: 'present as a slide deck', icon: '▦', accent: s(styles.iconSage), group: 'format', role: 'format' },
  { id: 'doc', label: 'doc', hint: 'export as a document', icon: '▧', accent: s(styles.iconSage), group: 'format', role: 'format' },
  { id: 'notes', label: 'notes', hint: 'distill into concise notes', icon: '▪', accent: s(styles.iconSage), group: 'format', role: 'format' },
  { id: 'brief', label: 'brief', hint: 'one-page executive summary', icon: '▫', accent: s(styles.iconSage), group: 'format', role: 'format' },
  { id: 'flashcards', label: 'flashcards', hint: 'drill with spaced-recall cards', icon: '▤', accent: s(styles.iconSage), group: 'format', role: 'format' },
  { id: 'quiz', label: 'quiz', hint: 'test your understanding', icon: '?', accent: s(styles.iconSage), group: 'format', role: 'format' },
  { id: 'exercise', label: 'exercise', hint: 'practice with guided problems', icon: '△', accent: s(styles.iconSage), group: 'format', role: 'format' },
  { id: 'podcast', label: 'podcast', hint: 'hear it discussed aloud', icon: '♪', accent: s(styles.iconSage), group: 'format', role: 'format' },
  { id: 'visualize', label: 'visualize', hint: 'map relationships as a diagram', icon: '◉', accent: s(styles.iconSage), group: 'format', role: 'format' },
  { id: 'draw', label: 'draw', hint: 'sketch a concept by hand', icon: '✎', accent: s(styles.iconSage), group: 'format', role: 'format' },
  { id: 'timeline', label: 'timeline', hint: 'trace a progression through time', icon: '→', accent: s(styles.iconSage), group: 'format', role: 'format' },
  { id: 'teach', label: 'teach', hint: 'structured reading material', icon: '▣', accent: s(styles.iconSage), group: 'format', role: 'format' },

  /* ── workflow: preset chains ───────────────────────────── */
  { id: 'delve', label: 'delve', hint: 'research → explain → diagram', icon: '◆', accent: s(styles.iconMargin), group: 'workflow', role: 'workflow', expandsTo: ['research', 'explain', 'visualize'] },
  { id: 'study', label: 'study', hint: 'teach → flashcards → quiz', icon: '◎', accent: s(styles.iconMargin), group: 'workflow', role: 'workflow', expandsTo: ['teach', 'flashcards', 'quiz'] },
  { id: 'lesson', label: 'lesson', hint: 'research → slides → quiz', icon: '▸', accent: s(styles.iconMargin), group: 'workflow', role: 'workflow', expandsTo: ['research', 'slides', 'quiz'] },
  { id: 'review', label: 'review', hint: 'summarize → flashcards', icon: '↻', accent: s(styles.iconMargin), group: 'workflow', role: 'workflow', expandsTo: ['summarize', 'flashcards'] },
  { id: 'origins', label: 'origins', hint: 'timeline → research → teach', icon: '⊙', accent: s(styles.iconMargin), group: 'workflow', role: 'workflow', expandsTo: ['timeline', 'research', 'teach'] },
  { id: 'illustrate', label: 'illustrate', hint: 'explain → sketch → define', icon: '◐', accent: s(styles.iconMargin), group: 'workflow', role: 'workflow', expandsTo: ['explain', 'draw', 'define'] },
  { id: 'deepen', label: 'deepen', hint: 'enrich with images and depth', icon: '⊕', accent: s(styles.iconMargin), group: 'workflow', role: 'workflow', expandsTo: ['research', 'teach', 'draw'] },
];

/** Set of output-format verb IDs — used for compound command detection. */
export const OUTPUT_VERB_IDS = new Set(
  COMMANDS.filter((c) => c.role === 'format').map((c) => c.id),
);

/** Set of action verb IDs. */
export const ACTION_VERB_IDS = new Set(
  COMMANDS.filter((c) => c.role === 'action').map((c) => c.id),
);

/** Lookup command by ID. */
export const COMMAND_MAP = new Map(COMMANDS.map((c) => [c.id, c]));

export const GROUP_LABELS: Record<string, string> = {
  investigate: 'investigate',
  format: 'format as…',
  workflow: 'workflow',
};

/** Pipe-separated list for regex matching in InputPreview. */
export const SLASH_COMMAND_PATTERN = COMMANDS.map((c) => c.id).join('|');
