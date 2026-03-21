/**
 * Echo (6.2)
 * A callback to something the student said in a previous session.
 * Preceded by a ↩ glyph. The notebook remembers.
 * See: 06-component-inventory.md, Family 6.
 */
import { colors } from '@/tokens/colors';
import { fontFamily } from '@/tokens/typography';
import { spacing } from '@/tokens/spacing';

interface EchoProps {
  children: string;
}

export function Echo({ children }: EchoProps) {
  return (
    <p
      style={{
        fontFamily: fontFamily.student,
        fontSize: '13px',
        fontWeight: 300,
        color: colors.inkFaint,
        paddingLeft: spacing.textIndent,
        marginBottom: spacing.scratchBottom,
        marginTop: 0,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 6,
      }}
    >
      <span style={{ color: colors.inkGhost, fontSize: '10px' }}>↩</span>
      <span>{children}</span>
    </p>
  );
}
