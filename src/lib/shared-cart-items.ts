import type { SharedCartItem } from '@/app/api/carts/route'

export function parseSharedCartItems(
  items: unknown,
): { ok: true; items: SharedCartItem[] } | { ok: false; error: string } {
  if (!Array.isArray(items) || items.length === 0) {
    return { ok: false, error: 'items vacío' }
  }
  const out: SharedCartItem[] = []
  for (const raw of items) {
    if (raw == null || typeof raw !== 'object') return { ok: false, error: 'item inválido' }
    const it = raw as Record<string, unknown>
    if (
      typeof it.product_id !== 'string' ||
      typeof it.name !== 'string' ||
      typeof it.unit_price !== 'number' ||
      typeof it.quantity !== 'number' ||
      it.quantity < 1
    ) {
      return { ok: false, error: 'item inválido' }
    }
    out.push({
      product_id: it.product_id,
      name: it.name,
      unit_price: it.unit_price,
      quantity: Math.floor(it.quantity),
      category_id: typeof it.category_id === 'string' ? it.category_id : undefined,
      category_name: typeof it.category_name === 'string' ? it.category_name : undefined,
      category_sort_order:
        typeof it.category_sort_order === 'number' ? it.category_sort_order : undefined,
    })
  }
  return { ok: true, items: out }
}
