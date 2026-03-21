/**
 * Scratch Note (1.2)
 * Small, informal fragment. A half-formed idea.
 * Preceded by a · glyph in ink-ghost.
 * See: 06-component-inventory.md, Family 1.
 */
import { colors } from '@/tokens/colors';
import { fontFamily } from '@/tokens/typography';
import { spacing } from '@/tokens/spacing';

interface ScratchNoteProps {
  children: string;
}

export function ScratchNote({ children }: ScratchNoteProps) {
  return (
    <p
      style={{
        fontFamily: fontFamily.student,
        fontSize: '15px',
        fontWeight: 300,
        fontStyle: 'italic',
        color: colors.inkSoft,
        lineHeight: 1.60,
        paddingLeft: spacing.textIndent,
        marginBottom: spacing.scratchBottom,
        marginTop: 0,
        position: 'relative',
      }}
    >
      <span
        style={{
          position: 'absolute',
          left: spacing.textIndent - 12,
          color: colors.inkGhost,
        }}
      >
        ·
      </span>
      {children}
    </p>
  );
}
