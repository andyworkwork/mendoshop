import type { CSSProperties } from 'react'
import { getStoreTemplate, STORE_TEMPLATES } from '@/lib/store-templates'
import type { ShopTheme } from '@/types/shop'

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

export function themeCssVars(theme: ShopTheme): CSSProperties {
  return {
    '--shop-primary': theme.primary,
    '--shop-accent': theme.accent,
  } as CSSProperties
}

export function shopBackgroundClass(theme: ShopTheme): string {
  if (theme.background === 'light') return 'store-surface-light'
  if (theme.background === 'solid') return 'bg-zinc-950'
  if (theme.background === 'pattern') return 'bg-zinc-900 shop-bg-pattern'
  return 'shop-bg-gradient'
}

export function parseTheme(raw: unknown): ShopTheme {
  if (!raw || typeof raw !== 'object') return STORE_TEMPLATES[0]!.defaults
  const t = raw as Partial<ShopTheme>
  const templateId = typeof t.templateId === 'string' ? t.templateId : 'bijuteria'

  const storeTpl = getStoreTemplate(templateId)
  const legacy = LEGACY_DEFAULTS[templateId]
  const base = storeTpl?.defaults ?? legacy ?? STORE_TEMPLATES[0]!.defaults

  return {
    templateId,
    primary: typeof t.primary === 'string' ? t.primary : base.primary,
    accent: typeof t.accent === 'string' ? t.accent : base.accent,
    background:
      t.background === 'solid' ||
      t.background === 'pattern' ||
      t.background === 'gradient' ||
      t.background === 'light'
        ? t.background
        : base.background,
  }
}
