/**
 * Rule — Horizontal divider (Family 7)
 * Ruled lines provide structure without commanding attention.
 * See: 02-visual-language.md, Material qualities.
 */
import styles from './Rule.module.css';

interface RuleProps {
  variant?: 'rule' | 'ruleLight';
  width?: string;
  margin?: number;
}

export function Rule({
  variant = 'rule',
  width = '100%',
  margin = 0,
}: RuleProps) {
  return (
    <hr
      className={styles[variant]}
      style={{ width, margin: `${margin}px auto` }}
    />
  );
}
