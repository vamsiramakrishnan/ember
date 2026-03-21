/**
 * Ember typography tokens — derived from 02-visual-language.md
 * Three voices: Cormorant Garamond (tutor), Crimson Pro (student), IBM Plex Mono (system).
 */

export const fontFamily = {
  tutor: "'Cormorant Garamond', serif",
  student: "'Crimson Pro', serif",
  system: "'IBM Plex Mono', monospace",
} as const;

export interface TypeStyle {
  fontFamily: string;
  fontSize: string;
  fontWeight: number;
  color: string;
  letterSpacing: string;
  lineHeight: number;
  fontStyle?: string;
}

/**
 * Every row in the type scale table from 02-visual-language.md.
 * Colours reference token names — resolved at the component/style level.
 */
export const typeScale = {
  pageTitle: {
    fontFamily: fontFamily.tutor,
    fontSize: '28px',
    fontWeight: 300,
    color: 'ink',
    letterSpacing: '-0.3px',
    lineHeight: 1.3,
  },
  sectionHeader: {
    fontFamily: fontFamily.tutor,
    fontSize: '20px',
    fontWeight: 500,
    color: 'ink',
    letterSpacing: '-0.2px',
    lineHeight: 1.4,
  },
  tutorMarginalia: {
    fontFamily: fontFamily.tutor,
    fontSize: '17.5px',
    fontWeight: 400,
    color: 'margin',
    letterSpacing: '0',
    lineHeight: 1.75,
  },
  tutorQuestion: {
    fontFamily: fontFamily.tutor,
    fontSize: '18px',
    fontWeight: 400,
    color: 'ink',
    letterSpacing: '0',
    lineHeight: 1.75,
    fontStyle: 'italic',
  },
  studentText: {
    fontFamily: fontFamily.student,
    fontSize: '18px',
    fontWeight: 400,
    color: 'ink',
    letterSpacing: '0',
    lineHeight: 1.80,
  },
  bodySecondary: {
    fontFamily: fontFamily.student,
    fontSize: '15px',
    fontWeight: 400,
    color: 'inkSoft',
    letterSpacing: '0',
    lineHeight: 1.70,
  },
  thinkerName: {
    fontFamily: fontFamily.tutor,
    fontSize: '22px',
    fontWeight: 500,
    color: 'ink',
    letterSpacing: '0',
    lineHeight: 1.3,
    fontStyle: 'italic',
  },
  sectionLabel: {
    fontFamily: fontFamily.tutor,
    fontSize: '13px',
    fontWeight: 500,
    color: 'inkFaint',
    letterSpacing: '2px',
    lineHeight: 1.4,
  },
  systemMeta: {
    fontFamily: fontFamily.system,
    fontSize: '11px',
    fontWeight: 300,
    color: 'inkGhost',
    letterSpacing: '1.5px',
    lineHeight: 1.4,
  },
  masteryValue: {
    fontFamily: fontFamily.system,
    fontSize: '11px',
    fontWeight: 300,
    color: 'inkFaint',
    letterSpacing: '0',
    lineHeight: 1.4,
  },
} as const;

export type TypeVariant = keyof typeof typeScale;
