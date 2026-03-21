/**
 * Question Bubble (1.5)
 * A question the student asks the tutor.
 * Distinguished by a small ? glyph in ink-faint Cormorant Garamond.
 * See: 06-component-inventory.md, Family 1.
 */
import { colors } from '@/tokens/colors';
import { fontFamily } from '@/tokens/typography';
import { spacing } from '@/tokens/spacing';

interface QuestionBubbleProps {
  children: string;
}

export function QuestionBubble({ children }: QuestionBubbleProps) {
  return (
    <p
      style={{
        fontFamily: fontFamily.student,
        fontSize: '17px',
        fontWeight: 400,
        fontStyle: 'italic',
        color: colors.ink,
        lineHeight: 1.70,
        paddingLeft: spacing.textIndent,
        marginBottom: spacing.entryGap,
        marginTop: 0,
        position: 'relative',
      }}
    >
      <span
        style={{
          position: 'absolute',
          left: spacing.textIndent - 14,
          fontFamily: fontFamily.tutor,
          fontSize: '14px',
          color: colors.inkFaint,
        }}
      >
        ?
      </span>
      {children}
    </p>
  );
}
