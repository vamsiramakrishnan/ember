/**
 * Session Divider (5.2)
 * Boundary between two sessions in the continuous notebook.
 * See: 06-component-inventory.md, Family 5.
 */
import { colors } from '@/tokens/colors';
import { spacing } from '@/tokens/spacing';

export function SessionDivider() {
  return (
    <hr
      style={{
        border: 'none',
        height: 1,
        backgroundColor: colors.rule,
        width: '100%',
        margin: `${spacing.sessionDividerMargin}px 0`,
      }}
    />
  );
}
