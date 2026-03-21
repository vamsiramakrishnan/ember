/**
 * Bookmark (3.5)
 * A folded corner. 8×8px amber triangle at the right edge.
 * See: 06-component-inventory.md, Family 3.
 */
import { colors } from '@/tokens/colors';

export function Bookmark() {
  return (
    <div
      style={{
        position: 'absolute',
        right: 0,
        top: 0,
        width: 0,
        height: 0,
        borderLeft: '8px solid transparent',
        borderTop: `8px solid ${colors.amber}`,
      }}
    />
  );
}
