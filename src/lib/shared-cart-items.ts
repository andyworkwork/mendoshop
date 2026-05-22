import type { SharedCartItem } from '@/app/api/carts/route'
import {
  SHARED_CART_MAX_ITEM_NAME_LEN,
  SHARED_CART_MAX_ITEMS,
  SHARED_CART_MAX_QUANTITY,
  SHARED_CART_MAX_UNIT_PRICE,
} from '@/lib/shared-cart-limits'

export function parseSharedCartItems(
  items: unknown,
): { ok: true; items: SharedCartItem[] } | { ok: false; error: string } {
  if (!Array.isArray(items) || items.length === 0) {
    return { ok: false, error: 'items vacío' }
  }
  if (items.length > SHARED_CART_MAX_ITEMS) {
    return { ok: false, error: `máximo ${SHARED_CART_MAX_ITEMS} productos` }
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
    if (it.product_id.length > 64) return { ok: false, error: 'item inválido' }
    if (it.name.length > SHARED_CART_MAX_ITEM_NAME_LEN) {
      return { ok: false, error: 'nombre de producto demasiado largo' }
    }
    if (it.quantity > SHARED_CART_MAX_QUANTITY) {
      return { ok: false, error: `cantidad máxima ${SHARED_CART_MAX_QUANTITY}` }
    }
    if (it.unit_price < 0 || it.unit_price > SHARED_CART_MAX_UNIT_PRICE) {
      return { ok: false, error: 'precio inválido' }
    }

    out.push({
      product_id: it.product_id,
      name: it.name.trim(),
      unit_price: it.unit_price,
      quantity: Math.floor(it.quantity),
      category_id:
        typeof it.category_id === 'string' && it.category_id.length <= 64
          ? it.category_id
          : undefined,
      category_name:
        typeof it.category_name === 'string' && it.category_name.length <= 120
          ? it.category_name.trim()
          : undefined,
      category_sort_order:
        typeof it.category_sort_order === 'number' && Number.isFinite(it.category_sort_order)
          ? it.category_sort_order
          : undefined,
    })
  }
  return { ok: true, items: out }
}
