/**
 * Hypothesis Marker (1.3)
 * A guess, prediction, or hypothesis marked by the student.
 * Indigo left border, indigo-dim background.
 * See: 06-component-inventory.md, Family 1.
 */
import { colors } from '@/tokens/colors';
import { fontFamily } from '@/tokens/typography';
import { spacing } from '@/tokens/spacing';

interface HypothesisMarkerProps {
  children: string;
}

export function HypothesisMarker({ children }: HypothesisMarkerProps) {
  return (
    <div
      style={{
        fontFamily: fontFamily.student,
        fontSize: '18px',
        fontWeight: 400,
        color: colors.ink,
        lineHeight: 1.80,
        paddingLeft: spacing.textIndent + 14,
        marginLeft: spacing.textIndent,
        marginBottom: spacing.entryGap,
        borderLeft: `2px solid rgba(91, 107, 138, 0.4)`,
        background: colors.indigoDim,
        borderRadius: 2,
        paddingTop: 4,
        paddingBottom: 4,
      }}
    >
      {children}
    </div>
  );
}
