/**
 * Marginal Reference (6.1)
 * Uninstructed note in the margin. A book left open on the desk.
 * Visible only on wide screens (inline on narrow).
 * See: 06-component-inventory.md, Family 6.
 */
import { colors } from '@/tokens/colors';
import { fontFamily } from '@/tokens/typography';

interface MarginalReferenceProps {
  children: string;
}

export function MarginalReference({ children }: MarginalReferenceProps) {
  return (
    <aside
      style={{
        fontFamily: fontFamily.student,
        fontSize: '13px',
        fontWeight: 300,
        fontStyle: 'italic',
        color: colors.inkGhost,
        maxWidth: 160,
        lineHeight: 1.55,
      }}
    >
      {children}
    </aside>
  );
}
