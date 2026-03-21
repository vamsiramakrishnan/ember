/**
 * Ember spacing tokens — derived from 02-visual-language.md
 * The generous rhythm of a well-typeset page.
 */

export const spacing = {
  /** Column max-width: the sacred 640px. */
  columnWidth: 640,
  /** Horizontal padding on narrow screens. */
  columnPadding: 24,
  /** Student text indent from column edge. */
  textIndent: 19,
  /** Tutor margin rule width. */
  marginRuleWidth: 3,
  /** Gap between margin rule and tutor text. */
  marginRuleGap: 16,
  /** Content indent for body beneath headings. */
  contentIndent: 38,

  /** Between header and first content. */
  headerToContent: 36,
  /** Between a section label and its content. */
  labelToContent: 18,
  /** Between notebook entries. */
  entryGap: 20,
  /** Between sections separated by a rule. */
  sectionGap: 32,
  /** Before and after a diagram. */
  diagramGap: 28,
  /** Before and after a silence marker. */
  silenceGap: 48,
  /** Between design principle blocks. */
  principleGap: 28,

  /** Scratch note cluster spacing. */
  scratchCluster: 8,
  /** Scratch note default bottom margin. */
  scratchBottom: 12,

  /** Margin zone width on wide screens. */
  marginZoneWidth: 160,
  /** Viewport breakpoint for margin zone. */
  marginZoneBreakpoint: 800,

  /** Session header top margin from nav. */
  sessionHeaderTop: 40,
  /** Session header bottom margin to first entry. */
  sessionHeaderBottom: 40,
  /** Session divider vertical margin. */
  sessionDividerMargin: 48,
} as const;

export type SpacingToken = keyof typeof spacing;
