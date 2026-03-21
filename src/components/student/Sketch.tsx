/**
 * Sketch (1.4)
 * Freeform drawing area. paper-warm background, rule-light borders.
 * See: 06-component-inventory.md, Family 1.
 */
import { colors } from '@/tokens/colors';

interface SketchProps {
  /** For demo, we render placeholder content. */
  children?: React.ReactNode;
  height?: number;
}

export function Sketch({ children, height = 120 }: SketchProps) {
  return (
    <div
      style={{
        maxWidth: 560,
        minHeight: height,
        background: colors.paperWarm,
        borderTop: `1px solid ${colors.ruleLight}`,
        borderBottom: `1px solid ${colors.ruleLight}`,
        margin: '0 0 20px 0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {children}
    </div>
  );
}
