import { flattenCatalogProducts, resolveFeaturedProducts } from '@/lib/featured-products'
import { fetchCategoriesWithNested } from '@/lib/fetch-catalog'
import { getProductImageUrl } from '@/lib/product-images'
import {
  buildResolvedShowcases,
  fetchTemplateShowcaseMap,
  resolveTemplateShowcase,
  type ResolvedTemplateShowcase,
} from '@/lib/template-showcase-data'
import { isShopSubscriptionActive } from '@/lib/plans'
import { mapShopRow, resolveShopBannerUrl } from '@/lib/shops'
import { getStoreTemplateOrDefault, STORE_TEMPLATES, type StoreTemplate } from '@/lib/store-templates'
import { createServiceClient } from '@/lib/supabase/service'
import type { ProductRow } from '@/types/catalog'
import type { ShopRow } from '@/types/shop'

export const HOME_CAROUSEL_MAX_SLIDES = 7

export type HomeCarouselSlide = {
  key: string
  template: StoreTemplate
  showcase: ResolvedTemplateShowcase
  /** Texto bajo la vitrina (nombre de tienda o rubro de plantilla). */
  caption: string
  /** Tema real de la tienda cuando el slide es un comercio. */
  theme?: ShopRow['theme']
}

function isShopCarouselEligible(shop: ShopRow): boolean {
  return shop.active && isShopSubscriptionActive(shop.plan_until)
}

function productImageUrl(path: string | null | undefined): string | null {
  if (!path) return null
  return getProductImageUrl(path, 'thumb')
}

function pickShowcaseProducts(
  shop: ShopRow,
  products: ProductRow[],
): { name: string; price: number; imageUrl: string | null }[] {
  const featured = resolveFeaturedProducts(products, shop.featured_product_ids, {
    publicOnly: true,
  })
  const pool = featured.length > 0 ? featured : products.filter((p) => p.image_path).slice(0, 2)
  const picked = (pool.length > 0 ? pool : products).slice(0, 2)

  if (picked.length === 0) {
    return [
      { name: 'Producto destacado', price: 0, imageUrl: null },
      { name: 'Ver catálogo', price: 0, imageUrl: null },
    ]
  }

  const rows = picked.map((p) => ({
    name: p.name,
    price: Number(p.price),
    imageUrl: productImageUrl(p.image_path),
  }))

  while (rows.length < 2) {
    rows.push({ name: 'Producto', price: 0, imageUrl: null })
  }
  return rows
}

export function buildShowcaseFromShop(
  shop: ShopRow,
  products: ProductRow[],
): ResolvedTemplateShowcase {
  const tagline =
    shop.description?.trim() ||
    (shop.category_label ? `${shop.category_label} · Mendoshop` : 'Tu tienda en Mendoshop')

  return {
    templateId: shop.theme.templateId,
    shopName: shop.name,
    tagline: tagline.slice(0, 120),
    bannerUrl: resolveShopBannerUrl(shop) ?? getStoreTemplateOrDefault(shop.theme.templateId).bannerSrc,
    products: pickShowcaseProducts(shop, products),
  }
}

function shopSlide(shop: ShopRow, products: ProductRow[]): HomeCarouselSlide {
  const template = getStoreTemplateOrDefault(shop.theme.templateId)
  return {
    key: `shop-${shop.id}`,
    template,
    showcase: buildShowcaseFromShop(shop, products),
    caption: shop.name,
    theme: shop.theme,
  }
}

async function fetchDefaultProShopIds(): Promise<string[]> {
  const service = createServiceClient()
  const now = new Date().toISOString()
  const { data, error } = await service
    .from('shops')
    .select('id')
    .eq('active', true)
    .eq('plan', 'pro')
    .or(`plan_until.is.null,plan_until.gt."${now}"`)
    .order('featured', { ascending: false })
    .order('view_count', { ascending: false })
    .limit(HOME_CAROUSEL_MAX_SLIDES)

  if (error) {
    console.error('fetchDefaultProShopIds', error.message)
    return []
  }
  return (data ?? []).map((r) => r.id as string)
}

async function fetchAdminCarouselShopIds(): Promise<string[]> {
  const service = createServiceClient()
  const { data, error } = await service
    .from('home_carousel_shops')
    .select('shop_id')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) {
    console.error('fetchAdminCarouselShopIds', error.message)
    return []
  }
  return (data ?? []).map((r) => r.shop_id as string)
}

async function loadShopsByIds(ids: string[]): Promise<ShopRow[]> {
  if (ids.length === 0) return []
  const service = createServiceClient()
  const { data, error } = await service.from('shops').select('*').in('id', ids)
  if (error) {
    console.error('loadShopsByIds', error.message)
    return []
  }
  const byId = new Map((data ?? []).map((r) => [r.id as string, mapShopRow(r as Record<string, unknown>)]))
  return ids.map((id) => byId.get(id)).filter((s): s is ShopRow => Boolean(s && isShopCarouselEligible(s)))
}

function templateSlides(count: number, rows: Awaited<ReturnType<typeof fetchTemplateShowcaseMap>>): HomeCarouselSlide[] {
  if (count <= 0) return []
  const usedTemplateIds = new Set<string>()
  const picked: StoreTemplate[] = []

  for (const tpl of STORE_TEMPLATES) {
    if (picked.length >= count) break
    if (usedTemplateIds.has(tpl.id)) continue
    picked.push(tpl)
    usedTemplateIds.add(tpl.id)
  }

  let i = 0
  while (picked.length < count) {
    picked.push(STORE_TEMPLATES[i % STORE_TEMPLATES.length]!)
    i += 1
  }

  return picked.slice(0, count).map((template) => ({
    key: `template-${template.id}`,
    template,
    showcase: resolveTemplateShowcase(template, rows.get(template.id)),
    caption: template.name,
  }))
}

/** Arma hasta 7 slides: tiendas (admin o Pro por defecto) + plantillas de relleno. */
export async function buildHomeCarouselSlides(): Promise<HomeCarouselSlide[]> {
  const adminIds = await fetchAdminCarouselShopIds()
  const shopIds =
    adminIds.length > 0 ? adminIds.slice(0, HOME_CAROUSEL_MAX_SLIDES) : await fetchDefaultProShopIds()

  const shops = await loadShopsByIds(shopIds)
  const service = createServiceClient()
  const showcaseRows = await fetchTemplateShowcaseMap()

  const slides: HomeCarouselSlide[] = []
  for (const shop of shops) {
    const categories = await fetchCategoriesWithNested(service, shop.id)
    const products = flattenCatalogProducts(categories)
    slides.push(shopSlide(shop, products))
  }

  const fillerCount = HOME_CAROUSEL_MAX_SLIDES - slides.length
  slides.push(...templateSlides(fillerCount, showcaseRows))

  if (slides.length > 0) return slides

  return buildResolvedShowcases(STORE_TEMPLATES.slice(0, HOME_CAROUSEL_MAX_SLIDES), showcaseRows).map(
    ({ template, showcase }) => ({
      key: `template-${template.id}`,
      template,
      showcase,
      caption: template.name,
    }),
  )
}
