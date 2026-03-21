/**
 * Prose Entry (1.1)
 * A paragraph of the student's writing. The most common element.
 * See: 06-component-inventory.md, Family 1.
 */
import { colors } from '@/tokens/colors';
import { fontFamily } from '@/tokens/typography';
import { spacing } from '@/tokens/spacing';

interface ProseEntryProps {
  children: string;
}

export function ProseEntry({ children }: ProseEntryProps) {
  return (
    <p
      style={{
        fontFamily: fontFamily.student,
        fontSize: '18px',
        fontWeight: 400,
        color: colors.ink,
        lineHeight: 1.80,
        paddingLeft: spacing.textIndent,
        marginBottom: spacing.entryGap,
        marginTop: 0,
      }}
    >
      {children}
    </p>
  );
}
