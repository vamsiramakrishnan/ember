/**
 * MarginZone — Right-margin zone for ambient elements (7.2)
 * Visible only on viewports wider than 800px.
 * See: 06-component-inventory.md, Family 7.
 */
import React from 'react';
import styles from './MarginZone.module.css';

interface MarginZoneProps {
  children: React.ReactNode;
}

export function MarginZone({ children }: MarginZoneProps) {
  return <aside className={styles.zone}>{children}</aside>;
}
