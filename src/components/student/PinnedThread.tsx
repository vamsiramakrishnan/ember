/**
 * Pinned Thread (3.1)
 * A question or idea the student wants to keep visible.
 * Preceded by a ⌃ glyph in ink-ghost.
 * See: 06-component-inventory.md, Family 3.
 */
import { colors } from '@/tokens/colors';
import { fontFamily } from '@/tokens/typography';

interface PinnedThreadProps {
  children: string;
}

export function PinnedThread({ children }: PinnedThreadProps) {
  return (
    <div
      style={{
        fontFamily: fontFamily.student,
        fontSize: '15px',
        fontWeight: 400,
        fontStyle: 'italic',
        color: colors.inkSoft,
        borderLeft: `1px solid ${colors.rule}`,
        paddingLeft: 16,
        marginBottom: 8,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 6,
      }}
    >
      <span style={{ color: colors.inkGhost, fontSize: '10px' }}>⌃</span>
      <span>{children}</span>
    </div>
  );
}
