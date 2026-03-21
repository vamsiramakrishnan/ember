/**
 * Marginalia (2.1)
 * Tutor's prose response — annotation in the margin of the student's notebook.
 * Layout: CSS grid — 3px rule | 16px gap | text.
 * See: 06-component-inventory.md, Family 2.
 */
import { colors } from '@/tokens/colors';
import { fontFamily } from '@/tokens/typography';
import { spacing } from '@/tokens/spacing';

interface MarginaliaProps {
  children: string;
}

export function Marginalia({ children }: MarginaliaProps) {
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
          fontWeight: 400,
          color: colors.margin,
          lineHeight: 1.75,
          margin: 0,
        }}
      >
        {children}
      </p>
    </div>
  );
}
