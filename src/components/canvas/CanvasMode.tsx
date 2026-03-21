/**
 * Canvas Mode (4.1)
 * Transforms a section from linear flow to spatial arrangement.
 * Bordered region with dot grid, paper-warm background.
 * See: 06-component-inventory.md, Family 4.
 */
import React from 'react';
import { colors } from '@/tokens/colors';
import { fontFamily } from '@/tokens/typography';

interface CanvasModeProps {
  label?: string;
  children: React.ReactNode;
  minHeight?: number;
}

export function CanvasMode({
  label = 'canvas',
  children,
  minHeight = 300,
}: CanvasModeProps) {
  return (
    <div
      style={{
        border: `1px solid ${colors.rule}`,
        borderRadius: 2,
        background: colors.paperWarm,
        minHeight,
        position: 'relative',
        padding: 24,
        marginBottom: 24,
        backgroundImage: `radial-gradient(${colors.ruleLight} 0.5px, transparent 0.5px)`,
        backgroundSize: '24px 24px',
      }}
    >
      <div
        style={{
          fontFamily: fontFamily.system,
          fontSize: '11px',
          fontWeight: 300,
          color: colors.inkGhost,
          marginBottom: 16,
        }}
      >
        {label}
      </div>
      <div style={{ position: 'relative' }}>{children}</div>
    </div>
  );
}
