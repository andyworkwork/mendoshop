import type { CSSProperties } from 'react'
import type { ShopBackgroundColors, ShopTheme } from '@/types/shop'

export const DEFAULT_BACKGROUND_COLORS: ShopBackgroundColors = {
  light: '#f4f4f5',
  solid: '#09090b',
  gradientTop: '#f9a825',
  gradientBottom: '#27272a',
  patternBase: '#262626',
  patternDot: '#f9a825',
}

export function resolveBackgroundColors(theme: ShopTheme): ShopBackgroundColors {
  const c = theme.backgroundColors ?? {}
  return {
    light: c.light ?? DEFAULT_BACKGROUND_COLORS.light,
    solid: c.solid ?? DEFAULT_BACKGROUND_COLORS.solid,
    gradientTop: c.gradientTop ?? theme.primary ?? DEFAULT_BACKGROUND_COLORS.gradientTop,
    gradientBottom: c.gradientBottom ?? DEFAULT_BACKGROUND_COLORS.gradientBottom,
    patternBase: c.patternBase ?? DEFAULT_BACKGROUND_COLORS.patternBase,
    patternDot: c.patternDot ?? theme.primary ?? DEFAULT_BACKGROUND_COLORS.patternDot,
  }
}

export function patchBackgroundColor(
  theme: ShopTheme,
  key: keyof ShopBackgroundColors,
  color: string,
): ShopTheme {
  return {
    ...theme,
    backgroundColors: {
      ...resolveBackgroundColors(theme),
      ...theme.backgroundColors,
      [key]: color,
    },
  }
}

export function backgroundPreviewStyle(
  id: ShopTheme['background'],
  colors: ShopBackgroundColors,
): CSSProperties {
  switch (id) {
    case 'light':
      return {
        backgroundColor: colors.light,
        border: '1px solid #e4e4e7',
      }
    case 'solid':
      return { backgroundColor: colors.solid }
    case 'gradient':
      return {
        background: `radial-gradient(ellipse 80% 80% at 50% 0%, color-mix(in srgb, ${colors.gradientTop} 45%, transparent), transparent), linear-gradient(180deg, #18181b 0%, ${colors.gradientBottom} 100%)`,
      }
    case 'pattern':
      return {
        backgroundColor: colors.patternBase,
        backgroundImage: `radial-gradient(color-mix(in srgb, ${colors.patternDot} 35%, transparent) 1px, transparent 1px)`,
        backgroundSize: '12px 12px',
      }
    default:
      return { backgroundColor: colors.light }
  }
}
