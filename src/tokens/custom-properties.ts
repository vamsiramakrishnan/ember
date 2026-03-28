/**
 * Token CSS custom properties.
 * Bridges TypeScript tokens → CSS custom properties → CSS Modules.
 * This is the single source of truth that feeds all .module.css files.
 */
import { colors } from './colors';
import { spacing } from './spacing';
import { motion } from './motion';
import { depth, material } from './depth';

export function getTokenCSS(): string {
  return `:root {
  /* Paper */
  --paper: ${colors.paper};
  --paper-deep: ${colors.paperDeep};
  --paper-warm: ${colors.paperWarm};

  /* Ink */
  --ink: ${colors.ink};
  --ink-soft: ${colors.inkSoft};
  --ink-faint: ${colors.inkFaint};
  --ink-ghost: ${colors.inkGhost};

  /* Accents */
  --margin: ${colors.margin};
  --margin-dim: ${colors.marginDim};
  --selection-highlight: ${colors.selectionHighlight};
  --sage: ${colors.sage};
  --sage-dim: ${colors.sageDim};
  --indigo: ${colors.indigo};
  --indigo-dim: ${colors.indigoDim};
  --amber: ${colors.amber};
  --amber-dim: ${colors.amberDim};

  /* Rules */
  --rule: ${colors.rule};
  --rule-light: ${colors.ruleLight};

  /* Font families */
  --font-tutor: 'Cormorant Garamond', serif;
  --font-student: 'Crimson Pro', serif;
  --font-system: 'IBM Plex Mono', monospace;

  /* Spacing */
  --column-width: ${spacing.columnWidth}px;
  --column-padding: ${spacing.columnPadding}px;
  --text-indent: ${spacing.textIndent}px;
  --margin-rule-width: ${spacing.marginRuleWidth}px;
  --margin-rule-gap: ${spacing.marginRuleGap}px;
  --content-indent: ${spacing.contentIndent}px;
  --entry-gap: ${spacing.entryGap}px;
  --section-gap: ${spacing.sectionGap}px;
  --diagram-gap: ${spacing.diagramGap}px;
  --silence-gap: ${spacing.silenceGap}px;
  --scratch-bottom: ${spacing.scratchBottom}px;
  --session-header-top: ${spacing.sessionHeaderTop}px;
  --session-header-bottom: ${spacing.sessionHeaderBottom}px;
  --session-divider-margin: ${spacing.sessionDividerMargin}px;

  /* Opacity */
  --past-session-opacity: 0.55;

  /* Motion */
  --entry-duration: ${motion.entryDuration};
  --entry-ease: ${motion.entryEase};
  --entry-translate-y: ${motion.entryTranslateY}px;
  --cursor-cycle: ${motion.cursorCycle};
  --cursor-opacity-max: ${motion.cursorOpacityMax};
  --tab-transition: ${motion.tabTransition};
  --mastery-transition: ${motion.masteryTransition};

  /* Philosophy starfield */
  --starfield-drift-duration: ${motion.starfieldDriftDuration};
  --parallax-transition: ${motion.parallaxTransition};

  /* Surface transitions */
  --surface-fade-duration: ${motion.surfaceFadeDuration};
  --surface-fade-ease: ${motion.surfaceFadeEase};

  /* Depth — physical notebook layering */
  --depth-none: ${depth.none};
  --depth-pressed: ${depth.pressed};
  --depth-adhered: ${depth.adhered};
  --depth-resting: ${depth.resting};
  --depth-lifted: ${depth.lifted};
  --depth-floating: ${depth.floating};

  /* Material — only for physical objects on the page */
  --material-page: ${material.page};
  --material-worn: ${material.worn};
  --material-sticky-note: ${material.stickyNote};
  --material-index-card: ${material.indexCard};
  --material-card-stock: ${material.cardStock};
  --material-clipping: ${material.clipping};
}

/* Tighter vertical rhythm on narrow screens */
@media (max-width: 800px) {
  :root {
    --entry-gap: 12px;
    --scratch-bottom: 8px;
    --diagram-gap: 18px;
    --section-gap: 24px;
    --silence-gap: 32px;
    --column-padding: 18px;
    --margin-rule-gap: 12px;
  }
}`;
}
