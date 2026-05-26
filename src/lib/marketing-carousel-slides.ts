import { buildHomeCarouselSlides, type HomeCarouselSlide } from '@/lib/home-carousel'
import type { ResolvedTemplateShowcase } from '@/lib/template-showcase-data'
import type { ShopTheme } from '@/types/shop'

export const MARKETING_CAROUSEL_SLIDE_TAG = 'carrusel-inicio'

/** Datos para renderizar en admin la misma vitrina que el carrusel de la home. */
export type MarketingCarouselSlidePayload = {
  key: string
  caption: string
  kind: 'template' | 'shop'
  templateId: string
  templateName: string
  rubro: string
  showcase: ResolvedTemplateShowcase
  theme?: ShopTheme
}

function slideToPayload(slide: HomeCarouselSlide): MarketingCarouselSlidePayload {
  const kind: 'template' | 'shop' = slide.key.startsWith('shop-') ? 'shop' : 'template'
  return {
    key: slide.key,
    caption: slide.caption,
    kind,
    templateId: slide.template.id,
    templateName: slide.template.name,
    rubro: slide.caption,
    showcase: slide.showcase,
    theme: slide.theme,
  }
}

export async function listMarketingCarouselSlides(): Promise<MarketingCarouselSlidePayload[]> {
  const slides = await buildHomeCarouselSlides()
  return slides.map(slideToPayload)
}

export function marketingAssetTagsForCarouselSlide(slideKey: string): string[] {
  return [MARKETING_CAROUSEL_SLIDE_TAG, slideKey]
}

export function assetBelongsToCarouselSlide(
  asset: { tags?: string[] | null },
  slideKey: string,
): boolean {
  return (asset.tags ?? []).includes(slideKey) && (asset.tags ?? []).includes(MARKETING_CAROUSEL_SLIDE_TAG)
}

