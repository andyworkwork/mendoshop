import type { CategoryRow, ProductRow } from '@/types/catalog'

export type FlatProduct = ProductRow & {
  categoryId: string
  categoryName: string
  categorySort: number
}

export function flattenProducts(categories: CategoryRow[]): FlatProduct[] {
  const out: FlatProduct[] = []
  for (const cat of categories) {
    for (const p of cat.products) {
      out.push({
        ...p,
        categoryId: cat.id,
        categoryName: cat.name,
        categorySort: cat.sort_order,
      })
    }
  }
  return out
}

export function productsForCategory(categories: CategoryRow[], categoryId: string): FlatProduct[] {
  return flattenProducts(categories).filter((p) => p.categoryId === categoryId)
}
