import type { CSSProperties } from 'react'
import { resolveBackgroundColors } from '@/lib/background-colors'
import {
  ensureReadableAccentOnFill,
  hexLuminance,
  parseHex,
} from '@/lib/color-contrast'
import { getStoreTemplate, STORE_TEMPLATES } from '@/lib/store-templates'
import type { ShopBackgroundColors, ShopTheme } from '@/types/shop'

export type ThemeTemplate = {
  id: string
  name: string
  description: string
  defaults: ShopTheme
  bannerSrc?: string
}

/** Plantillas para el panel (rubros + compatibilidad). */
export const THEME_TEMPLATES: ThemeTemplate[] = [
  ...STORE_TEMPLATES.map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description,
    defaults: t.defaults,
    bannerSrc: t.bannerSrc,
  })),
  {
    id: 'minimal',
    name: 'Mendoshop (marca)',
    description: 'Naranja y coral clásico',
    defaults: { templateId: 'minimal', primary: '#f9a825', accent: '#e53935', background: 'gradient' },
  },
]

const LEGACY_DEFAULTS: Record<string, ShopTheme> = {
  minimal: { templateId: 'minimal', primary: '#f9a825', accent: '#e53935', background: 'gradient' },
  bold: { templateId: 'bold', primary: '#dc2626', accent: '#1d4ed8', background: 'solid' },
  pastel: { templateId: 'pastel', primary: '#a78bfa', accent: '#f472b6', background: 'gradient' },
  dark: { templateId: 'dark', primary: '#22d3ee', accent: '#a3e635', background: 'solid' },
  mendoza: { templateId: 'mendoza', primary: '#7f1d1d', accent: '#ca8a04', background: 'pattern' },
}

/** Color de fondo de la tarjeta de producto (área nombre + precio y relleno de la tarjeta). */
export function resolveProductFrameColor(theme: ShopTheme): string {
  const raw = theme.productFrame?.trim()
  if (raw) return raw
  return theme.background === 'light' ? '#f4f4f5' : '#27272a'
}

/** Acento con contraste frente al fondo de tarjeta (nombre, precio, detalles). */
export function resolveAccentColor(theme: ShopTheme): string {
  const accent = theme.accent?.trim() || '#e53935'
  return ensureReadableAccentOnFill(accent, resolveProductFrameColor(theme))
}

export function isLightColor(hex: string | undefined | null): boolean {
  return hexLuminance(hex ?? '') > 150
}

export function themeCssVars(theme: ShopTheme): CSSProperties {
  const bg = resolveBackgroundColors(theme)
  const productFrame = resolveProductFrameColor(theme)
  const accent = resolveAccentColor(theme)
  return {
    '--shop-primary': theme.primary,
    '--shop-accent': accent,
    '--shop-product-frame': productFrame,
    '--shop-bg-light': bg.light,
    '--shop-bg-solid': bg.solid,
    '--shop-bg-gradient-top': bg.gradientTop,
    '--shop-bg-gradient-bottom': bg.gradientBottom,
    '--shop-bg-pattern-base': bg.patternBase,
    '--shop-bg-pattern-dot': bg.patternDot,
  } as CSSProperties
}

export { resolveBackgroundColors, patchBackgroundColor, backgroundPreviewStyle } from '@/lib/background-colors'
export type { ShopBackgroundColors }

export type VitrinaBackgroundId = ShopTheme['background']

export const VITRINA_BACKGROUND_OPTIONS: {
  id: VitrinaBackgroundId
  label: string
  hint: string
  previewClass: string
}[] = [
  {
    id: 'light',
    label: 'Claro',
    hint: 'Gris claro, estilo app',
    previewClass: 'store-bg-preview-light',
  },
  {
    id: 'gradient',
    label: 'Degradado',
    hint: 'Oscuro con brillos de color',
    previewClass: 'store-bg-preview-gradient',
  },
  {
    id: 'solid',
    label: 'Sólido oscuro',
    hint: 'Fondo negro uniforme',
    previewClass: 'store-bg-preview-solid',
  },
  {
    id: 'pattern',
    label: 'Patrón',
    hint: 'Oscuro con puntos',
    previewClass: 'store-bg-preview-pattern',
  },
]

export function shopBackgroundClass(theme: ShopTheme): string {
  if (theme.background === 'light') return 'store-surface-light'
  if (theme.background === 'solid') return 'shop-bg-solid'
  if (theme.background === 'pattern') return 'shop-bg-pattern'
  return 'shop-bg-gradient'
}

/** Clase de vista previa del fondo (usa --shop-primary / --shop-accent del tema). */
export function vitrinaBackgroundPreviewClass(background: VitrinaBackgroundId): string {
  return VITRINA_BACKGROUND_OPTIONS.find((o) => o.id === background)?.previewClass ?? 'store-bg-preview-light'
}

export function parseTheme(raw: unknown): ShopTheme {
  if (!raw || typeof raw !== 'object') return STORE_TEMPLATES[0]!.defaults
  const t = raw as Partial<ShopTheme>
  const templateId = typeof t.templateId === 'string' ? t.templateId : 'bijuteria'

  const storeTpl = getStoreTemplate(templateId)
  const legacy = LEGACY_DEFAULTS[templateId]
  const base = storeTpl?.defaults ?? legacy ?? STORE_TEMPLATES[0]!.defaults

  const primary = typeof t.primary === 'string' ? t.primary : base.primary
  const accent = typeof t.accent === 'string' ? t.accent : base.accent
  const background =
    t.background === 'solid' ||
    t.background === 'pattern' ||
    t.background === 'gradient' ||
    t.background === 'light'
      ? t.background
      : base.background
  const productFrame =
    typeof t.productFrame === 'string'
      ? t.productFrame
      : typeof base.productFrame === 'string'
        ? base.productFrame
        : background === 'light'
          ? '#e4e4e7'
          : '#ffffff'

  const rawBg = t.backgroundColors
  const backgroundColors: Partial<ShopBackgroundColors> | undefined =
    rawBg && typeof rawBg === 'object'
      ? {
          light: typeof rawBg.light === 'string' ? rawBg.light : undefined,
          solid: typeof rawBg.solid === 'string' ? rawBg.solid : undefined,
          gradientTop: typeof rawBg.gradientTop === 'string' ? rawBg.gradientTop : undefined,
          gradientBottom:
            typeof rawBg.gradientBottom === 'string' ? rawBg.gradientBottom : undefined,
          patternBase: typeof rawBg.patternBase === 'string' ? rawBg.patternBase : undefined,
          patternDot: typeof rawBg.patternDot === 'string' ? rawBg.patternDot : undefined,
        }
      : undefined

  return {
    templateId,
    primary,
    accent,
    productFrame,
    background,
    backgroundColors,
  }
}
