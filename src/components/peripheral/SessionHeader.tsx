/**
 * Session Header (5.1)
 * Date and topic notation at the top of each session.
 * See: 06-component-inventory.md, Family 5.
 */
import { colors } from '@/tokens/colors';
import { fontFamily } from '@/tokens/typography';
import { spacing } from '@/tokens/spacing';

interface SessionHeaderProps {
  sessionNumber: number;
  date: string;
  timeOfDay: string;
  topic: string;
}

export function SessionHeader({
  sessionNumber,
  date,
  timeOfDay,
  topic,
}: SessionHeaderProps) {
  return (
    <header
      style={{
        marginTop: spacing.sessionHeaderTop,
        marginBottom: spacing.sessionHeaderBottom,
      }}
    >
      <div
        style={{
          fontFamily: fontFamily.system,
          fontSize: '11px',
          fontWeight: 300,
          color: colors.inkFaint,
          letterSpacing: '1.5px',
          textTransform: 'uppercase',
          marginBottom: 12,
        }}
      >
        Session {sessionNumber} · {date} · {timeOfDay}
      </div>
      <h1
        style={{
          fontFamily: fontFamily.tutor,
          fontSize: '28px',
          fontWeight: 300,
          color: colors.ink,
          letterSpacing: '-0.3px',
          lineHeight: 1.3,
          margin: 0,
        }}
      >
        {topic}
      </h1>
    </header>
  );
}
