export type ShopPlan = 'free_trial' | 'basic' | 'pro'

export type ShopTheme = {
  templateId: 'minimal' | 'bold' | 'pastel' | 'dark' | 'mendoza'
  primary: string
  accent: string
  background: 'gradient' | 'solid' | 'pattern'
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
  templateId: 'minimal',
  primary: '#0d9488',
  accent: '#f59e0b',
  background: 'gradient',
}
