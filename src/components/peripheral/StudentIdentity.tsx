/**
 * Student Identity (5.5)
 * Name, duration, and session count. Present on every surface.
 * See: 06-component-inventory.md, Family 5.
 */
import { colors } from '@/tokens/colors';
import { fontFamily } from '@/tokens/typography';

interface StudentIdentityProps {
  name: string;
  duration: string;
  sessionNumber: number;
}

export function StudentIdentity({
  name,
  duration,
  sessionNumber,
}: StudentIdentityProps) {
  return (
    <span
      style={{
        fontFamily: fontFamily.system,
        fontSize: '11px',
        fontWeight: 300,
        color: colors.inkGhost,
      }}
    >
      {name} · {duration} · session {sessionNumber}
    </span>
  );
}
