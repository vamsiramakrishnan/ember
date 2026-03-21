/**
 * Group (3.4)
 * Lightweight container bundling related elements.
 * No visible boundary — only a shared left margin indicator.
 * See: 06-component-inventory.md, Family 3.
 */
import React from 'react';
import { colors } from '@/tokens/colors';

interface GroupProps {
  children: React.ReactNode;
}

export function Group({ children }: GroupProps) {
  return (
    <div
      style={{
        position: 'relative',
        paddingLeft: 16,
        marginBottom: 28,
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 1,
          backgroundColor: colors.ruleLight,
        }}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {children}
      </div>
    </div>
  );
}
