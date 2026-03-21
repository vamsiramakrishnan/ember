/**
 * Mastery Bar (5.3)
 * Thin indicator of fluency. Appears only in Constellation.
 * See: 06-component-inventory.md, Family 5.
 */
import { colors } from '@/tokens/colors';
import { fontFamily } from '@/tokens/typography';
import { motion } from '@/tokens/motion';
import type { MasteryLevel } from '@/types/mastery';

interface MasteryBarProps {
  concept: string;
  level: MasteryLevel;
  percentage: number;
}

const levelColors: Record<MasteryLevel, string> = {
  mastered: colors.sage,
  strong: colors.ink,
  developing: colors.indigo,
  exploring: colors.inkGhost,
};

export function MasteryBar({ concept, level, percentage }: MasteryBarProps) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div
        style={{
          fontFamily: fontFamily.student,
          fontSize: '15px',
          fontWeight: 400,
          color: colors.inkSoft,
          marginBottom: 6,
        }}
      >
        {concept}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          style={{
            flex: 1,
            height: 2,
            backgroundColor: colors.ruleLight,
            borderRadius: 1,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${percentage}%`,
              height: '100%',
              backgroundColor: levelColors[level],
              borderRadius: 1,
              transition: motion.masteryTransition,
            }}
          />
        </div>
        <span
          style={{
            fontFamily: fontFamily.system,
            fontSize: '11px',
            fontWeight: 300,
            color: colors.inkFaint,
            minWidth: 32,
            textAlign: 'right',
          }}
        >
          {percentage}%
        </span>
      </div>
    </div>
  );
}
