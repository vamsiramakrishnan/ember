/**
 * Silence Marker (2.6)
 * Active waiting. The most spacious element in the system.
 * Blinking cursor: 1px wide, 22px tall, ink at 30%, 1.2s fade.
 * See: 06-component-inventory.md, Family 2.
 */
import { colors } from '@/tokens/colors';
import { fontFamily } from '@/tokens/typography';
import { spacing } from '@/tokens/spacing';
import { motion } from '@/tokens/motion';

interface SilenceMarkerProps {
  text?: string;
}

const cursorKeyframes = `
@keyframes emberCursorBlink {
  0%, 100% { opacity: ${motion.cursorOpacityMax}; }
  50% { opacity: ${motion.cursorOpacityMin}; }
}
`;

export function SilenceMarker({ text }: SilenceMarkerProps) {
  return (
    <div
      style={{
        padding: `${spacing.silenceGap}px 0`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
      }}
    >
      <style>{cursorKeyframes}</style>
      {text && (
        <p
          style={{
            fontFamily: fontFamily.tutor,
            fontSize: '15px',
            fontStyle: 'italic',
            color: colors.inkGhost,
            letterSpacing: '0.5px',
            textAlign: 'center',
            margin: 0,
          }}
        >
          {text}
        </p>
      )}
      <div
        style={{
          width: 1,
          height: 36,
          backgroundColor: colors.rule,
        }}
      />
      <div
        style={{
          width: 1,
          height: 22,
          backgroundColor: colors.ink,
          animation: `emberCursorBlink ${motion.cursorCycle} ease infinite`,
        }}
      />
    </div>
  );
}
