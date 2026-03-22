/**
 * Entry type metadata — labels and visual tinting for block type indicators.
 * See: 08-touch-and-interaction-states.md, Block type indicators table.
 */

export interface TypeMeta {
  label: string;
  /** If true, uses the tinted colour variant (margin for tutor, indigo for student probes). */
  tinted?: boolean;
}

export const TYPE_META: Record<string, TypeMeta> = {
  prose: { label: 'prose' },
  scratch: { label: 'note' },
  hypothesis: { label: 'hypothesis', tinted: true },
  question: { label: 'question', tinted: true },
  sketch: { label: 'sketch' },
  'code-cell': { label: 'code' },
  image: { label: 'image' },
  'file-upload': { label: 'file' },
  embed: { label: 'link' },
  document: { label: 'doc' },
  'tutor-marginalia': { label: 'tutor', tinted: true },
  'tutor-question': { label: 'probe', tinted: true },
  'tutor-connection': { label: 'connection', tinted: true },
  'concept-diagram': { label: 'diagram' },
  'thinker-card': { label: 'thinker' },
  visualization: { label: 'visual' },
  illustration: { label: 'illustration' },
  silence: { label: '···' },
  divider: { label: '—' },
  echo: { label: 'echo' },
  'bridge-suggestion': { label: 'bridge' },
};

const STUDENT_TYPES = new Set([
  'prose', 'scratch', 'hypothesis', 'question', 'code-cell', 'image',
]);

export function isStudentEntry(type: string): boolean {
  return STUDENT_TYPES.has(type);
}
