import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  CategoryRow,
  ProductRow,
  SubcategoryRow,
  SubsubcategoriaRow,
} from '@/types/catalog'

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
  const productFilter = opts?.includeInactive ? '' : ', active.eq.true'

  const [catRes, subRes, ssRes, prodRes] = await Promise.all([
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
      .from('subsubcategorias')
      .select('id, subcategory_id, name, sort_order')
      .eq('shop_id', shopId)
      .order('sort_order'),
    supabase
      .from('products')
      .select(
        'id, subcategory_id, subsubcategoria_id, name, description, price, stock_quantity, image_path, image_gallery, active, sort_order',
      )
      .eq('shop_id', shopId)
      .order('sort_order'),
  ])

  if (catRes.error || !catRes.data?.length) return []

  const cats = catRes.data as Pick<CategoryRow, 'id' | 'name' | 'sort_order' | 'icon'>[]
  const subs = sortByOrder((subRes.data ?? []) as (SubcategoryRow & { category_id: string })[])
  const subsubs = sortByOrder(
    (ssRes.data ?? []) as (SubsubcategoriaRow & { subcategory_id: string })[],
  )

  let products = ((prodRes.data ?? []) as (Omit<ProductRow, 'image_gallery'> & { image_gallery?: unknown })[]).map(
    (r) => ({
      ...r,
      price: Number(r.price),
      image_gallery: normalizeGallery(r.image_gallery),
    }),
  )

  if (!opts?.includeInactive) {
    products = products.filter((p) => p.active)
  }

  const productsBySub = new Map<string, ProductRow[]>()
  const productsBySubsub = new Map<string, ProductRow[]>()

  for (const p of products) {
    if (p.subsubcategoria_id) {
      const id = p.subsubcategoria_id
      if (!productsBySubsub.has(id)) productsBySubsub.set(id, [])
      productsBySubsub.get(id)!.push(p)
    } else {
      if (!productsBySub.has(p.subcategory_id)) productsBySub.set(p.subcategory_id, [])
      productsBySub.get(p.subcategory_id)!.push(p)
    }
  }

  const subsubBySub = new Map<string, SubsubcategoriaRow[]>()
  for (const ss of subsubs) {
    const row: SubsubcategoriaRow = {
      id: ss.id,
      name: ss.name,
      sort_order: ss.sort_order,
      products: sortByOrder(productsBySubsub.get(ss.id) ?? []),
    }
    if (!subsubBySub.has(ss.subcategory_id)) subsubBySub.set(ss.subcategory_id, [])
    subsubBySub.get(ss.subcategory_id)!.push(row)
  }

  const subsByCat = new Map<string, SubcategoryRow[]>()
  for (const s of subs) {
    const sub: SubcategoryRow = {
      id: s.id,
      name: s.name,
      sort_order: s.sort_order,
      products: sortByOrder(productsBySub.get(s.id) ?? []),
      subsubcategorias: sortByOrder(subsubBySub.get(s.id) ?? []),
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
      for (const ss of s.subsubcategorias) n += ss.products.length
    }
  }
  return n
}
