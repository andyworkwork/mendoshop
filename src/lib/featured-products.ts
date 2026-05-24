import type { ShopPlan } from '@/types/shop'
import type { CategoryRow, ProductRow } from '@/types/catalog'

export const MAX_FEATURED_PRODUCTS_BASIC = 2
export const MAX_FEATURED_PRODUCTS_PRO = 4

/** Máximo guardado en DB (array puede tener hasta 4 IDs). */
export const MAX_FEATURED_PRODUCTS_STORED = MAX_FEATURED_PRODUCTS_PRO

/** @deprecated Usar maxFeaturedProductsForPlan */
export const MAX_FEATURED_PRODUCTS = MAX_FEATURED_PRODUCTS_BASIC

export function maxFeaturedProductsForPlan(plan: ShopPlan): number {
  return plan === 'pro' ? MAX_FEATURED_PRODUCTS_PRO : MAX_FEATURED_PRODUCTS_BASIC
}

export function planHasFeaturedCarousel(plan: ShopPlan): boolean {
  return plan === 'pro'
}

export function parseFeaturedProductIds(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  const ids = raw.filter((x): x is string => typeof x === 'string' && x.length > 0)
  return [...new Set(ids)].slice(0, MAX_FEATURED_PRODUCTS_STORED)
}

export function flattenCatalogProducts(categories: CategoryRow[]): ProductRow[] {
  const out: ProductRow[] = []
  for (const cat of categories) {
    for (const sub of cat.subcategories) {
      for (const p of sub.products) out.push(p)
    }
  }
  return out
}

export function resolveFeaturedProducts<T extends { id: string; active?: boolean }>(
  products: T[],
  featuredIds: string[],
  opts?: { publicOnly?: boolean; max?: number },
): T[] {
  const limit = opts?.max ?? MAX_FEATURED_PRODUCTS_BASIC
  const byId = new Map(products.map((p) => [p.id, p]))
  const out: T[] = []
  for (const id of featuredIds.slice(0, limit)) {
    const p = byId.get(id)
    if (!p) continue
    if (opts?.publicOnly && p.active === false) continue
    out.push(p)
  }
  return out
}

/** Quita IDs de productos que ya no existen o no están activos en el catálogo. */
export function sanitizeFeaturedProductIds(
  ids: string[],
  products: { id: string; active?: boolean }[],
  opts?: { activeOnly?: boolean; max?: number },
): string[] {
  const limit = opts?.max ?? MAX_FEATURED_PRODUCTS_STORED
  const activeOnly = opts?.activeOnly !== false
  const valid = new Set(
    products.filter((p) => !activeOnly || p.active !== false).map((p) => p.id),
  )
  const out: string[] = []
  for (const id of ids) {
    if (!valid.has(id)) continue
    if (out.includes(id)) continue
    out.push(id)
    if (out.length >= limit) break
  }
  return out
}
