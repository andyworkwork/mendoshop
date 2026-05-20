import type { ShopTheme } from '@/types/shop'

export type { StoreTemplate } from '@/lib/store-templates.generated'
export {
  STORE_TEMPLATES,
  RUBRO_PRESET_OPTIONS,
} from '@/lib/store-templates.generated'

import { STORE_TEMPLATES } from '@/lib/store-templates.generated'

const byId = new Map(STORE_TEMPLATES.map((t) => [t.id, t]))

export function getStoreTemplate(templateId: string) {
  return byId.get(templateId)
}

export function getStoreTemplateOrDefault(templateId: string) {
  return byId.get(templateId) ?? STORE_TEMPLATES[0]!
}

/** Banner de plantilla o null si es tema legacy sin imagen. */
export function templateBannerSrc(templateId: string): string | null {
  const tpl = byId.get(templateId)
  if (tpl) return tpl.bannerSrc
  const withSuffix = byId.get(`${templateId}-1`)
  return withSuffix?.bannerSrc ?? null
}

export { HERO_CAROUSEL_SLIDES } from '@/lib/hero-carousel-slides.generated'
