/**
 * Connection (2.3)
 * The tutor drawing a line between two things the student knows.
 * Identical to Marginalia, but first sentence is Medium (500) weight.
 * See: 06-component-inventory.md, Family 2.
 */
import { colors } from '@/tokens/colors';
import { fontFamily } from '@/tokens/typography';
import { spacing } from '@/tokens/spacing';

interface ConnectionProps {
  children: string;
  /** Character index where the emphasis (Medium weight) ends. */
  emphasisEnd: number;
}

export function Connection({ children, emphasisEnd }: ConnectionProps) {
  const emphasized = children.slice(0, emphasisEnd);
  const rest = children.slice(emphasisEnd);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `${spacing.marginRuleWidth}px 1fr`,
        gap: spacing.marginRuleGap,
        marginBottom: spacing.entryGap,
      }}
    >
      <div
        style={{
          width: spacing.marginRuleWidth,
          backgroundColor: colors.margin,
          opacity: 0.35,
          borderRadius: 1,
        }}
      />
      <p
        style={{
          fontFamily: fontFamily.tutor,
          fontSize: '17.5px',
          color: colors.margin,
          lineHeight: 1.75,
          margin: 0,
          fontWeight: 400,
        }}
      >
        <span style={{ fontWeight: 500 }}>{emphasized}</span>
        {rest}
      </p>
    </div>
  );
}
