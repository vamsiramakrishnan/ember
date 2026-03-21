/**
 * Thinker Card (2.5)
 * Introduction to a thinker entering the student's intellectual orbit.
 * Not a biography — a personal introduction.
 * See: 06-component-inventory.md, Family 2.
 */
import { colors } from '@/tokens/colors';
import { fontFamily } from '@/tokens/typography';
import type { Thinker } from '@/types/entries';

interface ThinkerCardProps {
  thinker: Thinker;
  showBottomBorder?: boolean;
}

export function ThinkerCard({ thinker, showBottomBorder }: ThinkerCardProps) {
  return (
    <div
      style={{
        padding: '20px 0',
        borderBottom: showBottomBorder
          ? `1px solid ${colors.ruleLight}`
          : 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
        <span
          style={{
            fontFamily: fontFamily.tutor,
            fontSize: '22px',
            fontWeight: 500,
            fontStyle: 'italic',
            color: colors.ink,
          }}
        >
          {thinker.name}
        </span>
        <span
          style={{
            fontFamily: fontFamily.system,
            fontSize: '11px',
            fontWeight: 300,
            color: colors.inkGhost,
          }}
        >
          {thinker.dates}
        </span>
      </div>
      <p
        style={{
          fontFamily: fontFamily.student,
          fontSize: '15px',
          fontWeight: 400,
          color: colors.inkSoft,
          lineHeight: 1.70,
          maxWidth: 480,
          marginTop: 6,
          marginBottom: 0,
        }}
      >
        {thinker.gift}
      </p>
      <p
        style={{
          fontFamily: fontFamily.system,
          fontSize: '11px',
          fontWeight: 300,
          color: colors.inkFaint,
          marginTop: 8,
          marginBottom: 0,
        }}
      >
        {thinker.bridge}
      </p>
    </div>
  );
}
