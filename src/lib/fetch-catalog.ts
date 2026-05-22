import type { SupabaseClient } from '@supabase/supabase-js'
import { normalizeImageFocus } from '@/lib/image-focus'
import type { CategoryRow, ProductRow, SubcategoryRow } from '@/types/catalog'

function sortByOrder<T extends { sort_order: number }>(arr: T[]): T[] {
  return [...arr].sort((a, b) => a.sort_order - b.sort_order)
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
  const [catRes, subRes, prodRes] = await Promise.all([
    supabase
      .from('categories')
      .select('id, name, sort_order, icon')
      .eq('shop_id', shopId)
      .order('sort_order'),
    supabase
      .from('subcategories')
      .select('id, category_id, name, sort_order')
      .eq('shop_id', shopId)
      .order('sort_order'),
    supabase
      .from('products')
      .select(
        'id, subcategory_id, subsubcategoria_id, name, description, price, stock_quantity, image_path, image_focus_x, image_focus_y, image_gallery, active, sort_order',
      )
      .eq('shop_id', shopId)
      .order('sort_order'),
  ])

  if (catRes.error || !catRes.data?.length) return []

  const cats = catRes.data as Pick<CategoryRow, 'id' | 'name' | 'sort_order' | 'icon'>[]
  const subs = sortByOrder((subRes.data ?? []) as (SubcategoryRow & { category_id: string })[])

  let products = ((prodRes.data ?? []) as (Omit<ProductRow, 'image_gallery' | 'image_focus_x' | 'image_focus_y'> & {
    image_gallery?: unknown
    image_focus_x?: number | null
    image_focus_y?: number | null
  })[]).map((r) => {
    const focus = normalizeImageFocus(r.image_focus_x, r.image_focus_y)
    return {
      ...r,
      subsubcategoria_id: null,
      price: Number(r.price),
      image_focus_x: focus.x,
      image_focus_y: focus.y,
      image_gallery: normalizeGallery(r.image_gallery),
    }
  })

  if (!opts?.includeInactive) {
    products = products.filter((p) => p.active)
  }

  const productsBySub = new Map<string, ProductRow[]>()
  for (const p of products) {
    if (!productsBySub.has(p.subcategory_id)) productsBySub.set(p.subcategory_id, [])
    productsBySub.get(p.subcategory_id)!.push(p)
  }

  const subsByCat = new Map<string, SubcategoryRow[]>()
  for (const s of subs) {
    const sub: SubcategoryRow = {
      id: s.id,
      name: s.name,
      sort_order: s.sort_order,
      products: sortByOrder(productsBySub.get(s.id) ?? []),
    }
    const catId = (s as { category_id: string }).category_id
    if (!subsByCat.has(catId)) subsByCat.set(catId, [])
    subsByCat.get(catId)!.push(sub)
  }

  return sortByOrder(cats).map((c) => ({
    ...c,
    icon: (c.icon as string | null) ?? null,
    subcategories: sortByOrder(subsByCat.get(c.id) ?? []),
  }))
}

export function countProducts(categories: CategoryRow[]): number {
  let n = 0
  for (const c of categories) {
    for (const s of c.subcategories) {
      n += s.products.length
    }
  }
  return n
}
