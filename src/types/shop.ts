export type ShopPlan = 'free_trial' | 'basic' | 'pro'

export type ShopTheme = {
  /** Id de plantilla (rubro) o legacy: minimal, bold, pastel, dark, mendoza */
  templateId: string
  primary: string
  accent: string
  background: 'gradient' | 'solid' | 'pattern' | 'light'
}

export type ShopRow = {
  id: string
  slug: string
  name: string
  description: string | null
  whatsapp_e164: string
  logo_path: string | null
  banner_path: string | null
  plan: ShopPlan
  plan_until: string | null
  active: boolean
  featured: boolean
  category_label: string | null
  theme: ShopTheme
  seo_title: string | null
  seo_description: string | null
  view_count: number
}

export const DEFAULT_THEME: ShopTheme = {
  templateId: 'bijuteria',
  primary: '#c9a227',
  accent: '#9333ea',
  background: 'light',
}
