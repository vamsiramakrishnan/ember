/**
 * Socratic Question (2.2)
 * The most important element — where Bloom and Feynman converge.
 * Tinted background, left border, italic Cormorant Garamond.
 * See: 06-component-inventory.md, Family 2.
 */
import { colors } from '@/tokens/colors';
import { fontFamily } from '@/tokens/typography';

interface SocraticQuestionProps {
  children: string;
}

export function SocraticQuestion({ children }: SocraticQuestionProps) {
  return (
    <blockquote
      style={{
        fontFamily: fontFamily.tutor,
        fontSize: '18px',
        fontWeight: 400,
        fontStyle: 'italic',
        color: colors.ink,
        lineHeight: 1.75,
        background: colors.marginDim,
        borderLeft: `2px solid ${colors.margin}`,
        padding: '20px 24px',
        borderRadius: 2,
        marginBottom: 24,
        marginTop: 0,
        marginLeft: 0,
        marginRight: 0,
      }}
    >
      {children}
    </blockquote>
  );
}
