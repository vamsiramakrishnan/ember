/**
 * Ember colour tokens — derived from 02-visual-language.md
 * The palette of a well-worn notebook: aged paper, real ink, cloth-bound spines.
 */

export const colors = {
  /** Primary background. The page itself. */
  paper: '#F6F1EA',
  /** Recessed areas, fold lines, gentle shadows. */
  paperDeep: '#EDE6DB',
  /** Where the light falls directly. Used sparingly. */
  paperWarm: '#F9F4ED',

  /** Primary text. The student's writing. Headlines. */
  ink: '#2C2825',
  /** Secondary text. Body paragraphs, descriptions. */
  inkSoft: '#5C5550',
  /** Tertiary text. Metadata, dates, system information. */
  inkFaint: '#9B9590',
  /** Guide lines, placeholders. Nearly invisible. */
  inkGhost: '#C8C2BA',

  /** The tutor's voice. Terracotta. */
  margin: '#B8564F',
  /** Background tint for tutor's questions. 7% opacity. */
  marginDim: 'rgba(184, 86, 79, 0.07)',
  /** Text selection highlight. 15% opacity — visible but warm. */
  selectionHighlight: 'rgba(196, 154, 60, 0.22)',

  /** Mastery, growth, fluency. Cloth-bound green. */
  sage: '#6B8F71',
  /** Background for mastery-related information. 10% opacity. */
  sageDim: 'rgba(107, 143, 113, 0.10)',

  /** Inquiry, open questions. Linen-bound blue-grey. */
  indigo: '#5B6B8A',
  /** Background for inquiry-related information. 8% opacity. */
  indigoDim: 'rgba(91, 107, 138, 0.08)',

  /** Connection, synthesis. Brass. The reading lamp. */
  amber: '#C49A3C',
  /** Background for connection moments. 8% opacity. */
  amberDim: 'rgba(196, 154, 60, 0.08)',

  /** Section dividers, borders, horizontal rules. */
  rule: '#DDD6CC',
  /** Lightest structural lines. Tab underlines, entry separators. */
  ruleLight: '#EBE5DC',
} as const;

export type ColorToken = keyof typeof colors;
