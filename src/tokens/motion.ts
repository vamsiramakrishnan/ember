/**
 * Ember motion tokens — derived from 02-visual-language.md
 * Slow, restrained. The motion of a page being turned.
 */

export const motion = {
  /** Entry reveal vertical translation. */
  entryTranslateY: 8,
  /** Entry reveal duration. */
  entryDuration: '0.7s',
  /** Entry reveal easing. */
  entryEase: 'ease',

  /** Staggered reveal interval between entries. */
  revealInterval: 950,
  /** Staggered reveal stagger delay. */
  revealStagger: 160,

  /** Cursor blink cycle duration. */
  cursorCycle: '1.2s',
  /** Cursor blink max opacity. */
  cursorOpacityMax: 0.3,
  /** Cursor blink min opacity. */
  cursorOpacityMin: 0,

  /** Tab transition duration. */
  tabTransition: '0.3s ease',

  /** Card slide-in duration. */
  cardSlideIn: '0.2s',
  /** Card slide-in translation. */
  cardSlideInY: 8,

  /** Mastery bar fill transition. */
  masteryTransition: '1.5s cubic-bezier(0.16, 1, 0.3, 1)',

  /** "Take your time" prompt fade-in. */
  gentlePromptFade: '2s',
} as const;

export type MotionToken = keyof typeof motion;
