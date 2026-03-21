/**
 * Text — Polymorphic text component (Family 7)
 * Maps every variant in the type scale to its exact visual specification.
 * See: 02-visual-language.md, Typography section.
 */
import React from 'react';
import { typeScale, type TypeVariant } from '@/tokens/typography';
import { colors, type ColorToken } from '@/tokens/colors';

interface TextProps {
  variant: TypeVariant;
  as?: keyof React.JSX.IntrinsicElements;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  color?: ColorToken;
}

function resolveColor(tokenName: string): string {
  return colors[tokenName as ColorToken] ?? tokenName;
}

export function Text({
  variant,
  as: Tag = 'span',
  children,
  className,
  style,
  color,
}: TextProps) {
  const spec = typeScale[variant];
  const resolved: React.CSSProperties = {
    fontFamily: spec.fontFamily,
    fontSize: spec.fontSize,
    fontWeight: spec.fontWeight,
    color: resolveColor(color ?? spec.color),
    letterSpacing: spec.letterSpacing,
    lineHeight: spec.lineHeight,
    fontStyle: 'fontStyle' in spec ? (spec as { fontStyle: string }).fontStyle : undefined,
    margin: 0,
    ...style,
  };

  return React.createElement(
    Tag,
    { className, style: resolved },
    children,
  );
}
