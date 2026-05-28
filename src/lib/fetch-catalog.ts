import type { SupabaseClient } from '@supabase/supabase-js'
import { normalizeImageFocus } from '@/lib/image-focus'
import type { CategoryRow, ProductRow } from '@/types/catalog'

const CATALOG_LOCALE = 'es-AR'

function sortByOrder<T extends { sort_order: number }>(arr: T[]): T[] {
  return [...arr].sort((a, b) => a.sort_order - b.sort_order)
}

/** Productos por nombre dentro de cada categoría (editor + vitrina). */
export function sortProductsByName(products: ProductRow[]): ProductRow[] {
  return [...products].sort((a, b) =>
    a.name.trim().localeCompare(b.name.trim(), CATALOG_LOCALE, { sensitivity: 'base' }),
  )
}

function normalizeGallery(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  return raw.filter((x): x is string => typeof x === 'string')
}

export async function fetchCategoriesWithNested(
  supabase: SupabaseClient,
  shopId: string,
  opts?: { includeInactive?: boolean },
): Promise<CategoryRow[]> {
  const [catRes, prodRes] = await Promise.all([
    supabase
      .from('categories')
      .select('id, name, sort_order, icon')
      .eq('shop_id', shopId)
      .order('sort_order'),
    supabase
      .from('products')
      .select(
        'id, category_id, name, description, product_details, detail_view_count, price, stock_quantity, image_path, image_focus_x, image_focus_y, image_gallery, active, sort_order',
      )
      .eq('shop_id', shopId)
      .order('name'),
  ])

  if (catRes.error || !catRes.data?.length) return []

  const cats = catRes.data as Pick<CategoryRow, 'id' | 'name' | 'sort_order' | 'icon'>[]

  let products = ((prodRes.data ?? []) as (Omit<
    ProductRow,
    'image_gallery' | 'image_focus_x' | 'image_focus_y'
  > & {
    image_gallery?: unknown
    image_focus_x?: number | null
    image_focus_y?: number | null
    product_details?: string | null
    detail_view_count?: number | null
  })[]).map((r) => {
    const focus = normalizeImageFocus(r.image_focus_x, r.image_focus_y)
    return {
      ...r,
      price: Number(r.price),
      product_details: r.product_details?.trim() || null,
      detail_view_count: Number(r.detail_view_count ?? 0),
      image_focus_x: focus.x,
      image_focus_y: focus.y,
      image_gallery: normalizeGallery(r.image_gallery),
    }
  })

  if (!opts?.includeInactive) {
    products = products.filter((p) => p.active)
  }

  const productsByCat = new Map<string, ProductRow[]>()
  for (const p of products) {
    if (!productsByCat.has(p.category_id)) productsByCat.set(p.category_id, [])
    productsByCat.get(p.category_id)!.push(p)
  }

  return sortByOrder(cats).map((c) => ({
    ...c,
    icon: (c.icon as string | null) ?? null,
    products: sortProductsByName(productsByCat.get(c.id) ?? []),
  }))
}

export function countProducts(categories: CategoryRow[]): number {
  let n = 0
  for (const c of categories) {
    n += c.products.length
  }
  return n
}
