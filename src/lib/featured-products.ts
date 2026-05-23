import type { CategoryRow, ProductRow } from '@/types/catalog'

export const MAX_FEATURED_PRODUCTS = 2

export function parseFeaturedProductIds(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  const ids = raw.filter((x): x is string => typeof x === 'string' && x.length > 0)
  return [...new Set(ids)].slice(0, MAX_FEATURED_PRODUCTS)
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
  opts?: { publicOnly?: boolean },
): T[] {
  const byId = new Map(products.map((p) => [p.id, p]))
  const out: T[] = []
  for (const id of featuredIds.slice(0, MAX_FEATURED_PRODUCTS)) {
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
  opts?: { activeOnly?: boolean },
): string[] {
  const activeOnly = opts?.activeOnly !== false
  const valid = new Set(
    products.filter((p) => !activeOnly || p.active !== false).map((p) => p.id),
  )
  const out: string[] = []
  for (const id of ids) {
    if (!valid.has(id)) continue
    if (out.includes(id)) continue
    out.push(id)
    if (out.length >= MAX_FEATURED_PRODUCTS) break
  }
  return out
}
