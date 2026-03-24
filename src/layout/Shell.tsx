/**
 * Shell — Outer shell, background, global styles.
 * The warm paper surface. The reading lamp.
 *
 * When a session topic is set, an ambient texture is generated and
 * rendered at 4% opacity as a background layer — creating a subtle
 * atmospheric change per topic. Studying astronomy feels different
 * from studying philosophy.
 */
import React, { useMemo } from 'react';
import { getTokenCSS } from '@/tokens/custom-properties';
import { useAmbientTexture } from '@/hooks/useAmbientTexture';
import '@/tokens/global.css';
import styles from './Shell.module.css';

interface ShellProps {
  children: React.ReactNode;
  /** Current session topic — drives ambient texture generation. */
  sessionTopic?: string | null;
}

const tokenStyles = getTokenCSS();

export function Shell({ children, sessionTopic }: ShellProps) {
  const textureUrl = useAmbientTexture(sessionTopic ?? null);

  const ambientStyle = useMemo(() => {
    if (!textureUrl) return undefined;
    return {
      backgroundImage: `url(${textureUrl})`,
      backgroundSize: '512px 512px',
      backgroundRepeat: 'repeat' as const,
      opacity: 0.04,
    } as React.CSSProperties;
  }, [textureUrl]);

  return (
    <>
      <style>{tokenStyles}</style>
      <div className={styles.shell}>
        {ambientStyle && (
          <div
            className={styles.ambientLayer}
            style={ambientStyle}
            aria-hidden="true"
          />
        )}
        {children}
      </div>
    </>
  );
}
