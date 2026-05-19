import type { CSSProperties } from 'react'
import type { ShopTheme } from '@/types/shop'

export type ThemeTemplate = {
  id: ShopTheme['templateId']
  name: string
  description: string
  defaults: ShopTheme
}

export const THEME_TEMPLATES: ThemeTemplate[] = [
  {
    id: 'minimal',
    name: 'Mendoshop',
    description: 'Naranja y coral (marca)',
    defaults: { templateId: 'minimal', primary: '#f9a825', accent: '#e53935', background: 'gradient' },
  },
  {
    id: 'bold',
    name: 'Bold',
    description: 'Colores fuertes',
    defaults: { templateId: 'bold', primary: '#dc2626', accent: '#1d4ed8', background: 'solid' },
  },
  {
    id: 'pastel',
    name: 'Pastel',
    description: 'Suave y amigable',
    defaults: { templateId: 'pastel', primary: '#a78bfa', accent: '#f472b6', background: 'gradient' },
  },
  {
    id: 'dark',
    name: 'Oscuro',
    description: 'Fondo oscuro elegante',
    defaults: { templateId: 'dark', primary: '#22d3ee', accent: '#a3e635', background: 'solid' },
  },
  {
    id: 'mendoza',
    name: 'Mendoza',
    description: 'Tonos tierra y vino',
    defaults: { templateId: 'mendoza', primary: '#7f1d1d', accent: '#ca8a04', background: 'pattern' },
  },
]

export function themeCssVars(theme: ShopTheme): CSSProperties {
  return {
    '--shop-primary': theme.primary,
    '--shop-accent': theme.accent,
  } as CSSProperties
}

export function shopBackgroundClass(theme: ShopTheme): string {
  if (theme.background === 'solid') return 'bg-zinc-950'
  if (theme.background === 'pattern') return 'bg-zinc-900 shop-bg-pattern'
  return 'shop-bg-gradient'
}

export function parseTheme(raw: unknown): ShopTheme {
  if (!raw || typeof raw !== 'object') return THEME_TEMPLATES[0]!.defaults
  const t = raw as Partial<ShopTheme>
  const ids = THEME_TEMPLATES.map((x) => x.id)
  const templateId = ids.includes(t.templateId as ShopTheme['templateId'])
    ? (t.templateId as ShopTheme['templateId'])
    : 'minimal'
  return {
    templateId,
    primary: typeof t.primary === 'string' ? t.primary : '#f9a825',
    accent: typeof t.accent === 'string' ? t.accent : '#e53935',
    background:
      t.background === 'solid' || t.background === 'pattern' || t.background === 'gradient'
        ? t.background
        : 'gradient',
  }
}
