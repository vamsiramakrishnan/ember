/**
 * Group (3.4)
 * Lightweight container bundling related elements.
 * Supports collapse to single line with count indicator.
 * See: 06-component-inventory.md, Family 3.
 */
import React, { useState } from 'react';
import styles from './Group.module.css';

interface GroupProps {
  children: React.ReactNode;
  /** First element's text, shown when collapsed. */
  previewText?: string;
}

export function Group({ children, previewText }: GroupProps) {
  const [collapsed, setCollapsed] = useState(false);
  const count = React.Children.count(children);

  return (
    <div className={styles.group}>
      <div className={styles.groupRule} />
      {collapsed ? (
        <button
          className={styles.collapsedLabel}
          onClick={() => setCollapsed(false)}
          type="button"
          aria-expanded={false}
        >
          <span>{previewText ?? 'Grouped items'}</span>
          <span className={styles.countBadge}>+ {count - 1} more</span>
        </button>
      ) : (
        <>
          <div className={styles.items}>{children}</div>
          {count > 1 && (
            <button
              className={styles.toggle}
              onClick={() => setCollapsed(true)}
            >
              collapse
            </button>
          )}
        </>
      )}
    </div>
  );
}
