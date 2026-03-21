/**
 * Rule — Horizontal divider (Family 7)
 * Ruled lines provide structure without commanding attention.
 * See: 02-visual-language.md, Material qualities.
 */
import { colors } from '@/tokens/colors';

interface RuleProps {
  /** Use 'rule' for standard, 'ruleLight' for lightest. */
  variant?: 'rule' | 'ruleLight';
  /** Width as percentage of container. Default 100%. */
  width?: string;
  /** Vertical margin in px. */
  margin?: number;
}

export function Rule({
  variant = 'rule',
  width = '100%',
  margin = 0,
}: RuleProps) {
  return (
    <hr
      style={{
        border: 'none',
        height: 1,
        backgroundColor: colors[variant],
        width,
        margin: `${margin}px auto`,
      }}
    />
  );
}
