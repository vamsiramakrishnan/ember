/**
 * MarginZone — Right-margin zone for ambient elements (7.2)
 * Visible only on viewports wider than 800px.
 * See: 06-component-inventory.md, Family 7.
 */
import React from 'react';
import { spacing } from '@/tokens/spacing';
import { colors } from '@/tokens/colors';

interface MarginZoneProps {
  children: React.ReactNode;
}

export function MarginZone({ children }: MarginZoneProps) {
  return (
    <aside
      style={{
        position: 'absolute',
        right: -spacing.marginZoneWidth - 32,
        top: 0,
        width: spacing.marginZoneWidth,
        borderLeft: `1px solid ${colors.ruleLight}`,
        paddingLeft: 12,
      }}
    >
      {children}
    </aside>
  );
}
