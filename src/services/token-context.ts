/**
 * Shared design-token context for AI service prompts.
 *
 * Builds style context strings from the actual token values in src/tokens/,
 * so AI-generated HTML stays in sync with the app's design system.
 */
import { colors } from '@/tokens/colors';
import { fontFamily } from '@/tokens/typography';

/** Compact colour palette for injection into AI prompts. */
export const EMBER_COLOR_CONTEXT = `Ember colour palette:
- Paper: ${colors.paper} | Paper-deep: ${colors.paperDeep} | Paper-warm: ${colors.paperWarm}
- Ink: ${colors.ink} | Ink-soft: ${colors.inkSoft} | Ink-faint: ${colors.inkFaint} | Ink-ghost: ${colors.inkGhost}
- Margin: ${colors.margin} | Margin-dim: ${colors.marginDim}
- Sage: ${colors.sage} | Sage-dim: ${colors.sageDim}
- Indigo: ${colors.indigo} | Indigo-dim: ${colors.indigoDim}
- Amber: ${colors.amber} | Amber-dim: ${colors.amberDim}
- Rule: ${colors.rule} | Rule-light: ${colors.ruleLight}
- No pure black or white.`;

/** Full design context for HTML-generating prompts. */
export const EMBER_STYLE_CONTEXT = `
Use these design tokens for all generated HTML:
- Background: ${colors.paper} (paper)
- Primary text: ${colors.ink} (ink)
- Soft text: ${colors.inkSoft} (ink-soft)
- Faint text: ${colors.inkFaint} (ink-faint)
- Ghost text: ${colors.inkGhost} (ink-ghost)
- Margin accent: ${colors.margin} (margin)
- Sage accent: ${colors.sage} (sage)
- Indigo accent: ${colors.indigo} (indigo)
- Amber accent: ${colors.amber} (amber)
- Rule lines: ${colors.rule}
- Fonts: ${fontFamily.tutor} for headings, ${fontFamily.student} for body, ${fontFamily.system} for code/labels
- Corner radius: 2px max
- No box shadows, no gradients, no pure black or white
- Borders: 1px solid with very low opacity
- Feel: warm, quiet, like a well-typeset notebook page
`;

/** Ember identity + design context for agent system instructions. */
export const EMBER_DESIGN_CONTEXT = `You are part of Ember, an AI-powered aristocratic tutoring interface. The governing metaphor is: a well-worn notebook on a wooden desk, under a reading lamp, in a quiet library, in the late afternoon.

Design tokens:
- Paper: ${colors.paper} | Ink: ${colors.ink} | Ink-soft: ${colors.inkSoft}
- Margin: ${colors.margin} | Sage: ${colors.sage} | Indigo: ${colors.indigo} | Amber: ${colors.amber}
- Fonts: ${fontFamily.tutor}, ${fontFamily.student}, ${fontFamily.system}
- No shadows, no gradients, no pure black/white. Corner radius 2px. Borders 1px at low opacity.
- Aesthetic: warm, quiet, typographically precise, like a beautifully set book.`;
