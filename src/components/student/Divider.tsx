/**
 * Divider (3.6)
 * A visual break inserted by the student.
 * 1px rule at 60% width, centred. Optional label.
 * See: 06-component-inventory.md, Family 3.
 */
import { colors } from '@/tokens/colors';
import { fontFamily } from '@/tokens/typography';
import { spacing } from '@/tokens/spacing';

interface DividerProps {
  label?: string;
}

export function Divider({ label }: DividerProps) {
  return (
    <div
      style={{
        margin: `${spacing.sectionGap}px 0`,
        textAlign: 'center',
      }}
    >
      {label && (
        <div
          style={{
            fontFamily: fontFamily.system,
            fontSize: '11px',
            fontWeight: 300,
            color: colors.inkGhost,
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            marginBottom: 8,
          }}
        >
          {label}
        </div>
      )}
      <hr
        style={{
          border: 'none',
          height: 1,
          backgroundColor: colors.rule,
          width: '60%',
          margin: '0 auto',
        }}
      />
    </div>
  );
}
