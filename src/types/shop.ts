export type ShopPlan = 'free_trial' | 'basic' | 'pro'

export type ShopBackgroundColors = {
  light: string
  solid: string
  gradientTop: string
  gradientBottom: string
  patternBase: string
  patternDot: string
}

export type ShopTheme = {
  /** Id de plantilla (rubro) o legacy: minimal, bold, pastel, dark, mendoza */
  templateId: string
  primary: string
  accent: string
  /** Fondo (y borde) de la tarjeta de producto en la vitrina. */
  productFrame?: string
  /** Tagline, títulos de sección, categorías y etiquetas de orden. */
  titleColor?: string
  background: 'gradient' | 'solid' | 'pattern' | 'light'
  /** Colores del fondo de la tienda (por estilo). */
  backgroundColors?: Partial<ShopBackgroundColors>
}

export type ShopRow = {
  id: string
  slug: string
  name: string
  description: string | null
  whatsapp_e164: string
  logo_path: string | null
  banner_path: string | null
  banner_focus_x: number
  banner_focus_y: number
  /** Si false, no muestra el nombre superpuesto en el banner (la imagen ya lo trae). */
  banner_show_shop_name: boolean
  plan: ShopPlan
  plan_until: string | null
  active: boolean
  featured: boolean
  category_label: string | null
  theme: ShopTheme
  seo_title: string | null
  seo_description: string | null
  view_count: number
  instagram_url: string | null
  tiktok_url: string | null
  /** Sitio web propio (ej. luminamendoza.shop). */
  website_url: string | null
  /** Si true, muestra ícono de WhatsApp en el pie (usa whatsapp_e164). */
  social_whatsapp_visible: boolean
  /** IDs para "Productos destacados" (hasta 4 guardados; plan Pro muestra carrusel). */
  featured_product_ids: string[]
  /** Icono del botón "Categorías" en el selector de orden de la vitrina. */
  category_view_icon: string
  /** ISO timestamp; sirve para invalidar caché del banner en CDN. */
  updated_at: string
}

export const DEFAULT_THEME: ShopTheme = {
  templateId: 'bijuteria',
  primary: '#c9a227',
  accent: '#9333ea',
  productFrame: '#ffffff',
  background: 'light',
}
