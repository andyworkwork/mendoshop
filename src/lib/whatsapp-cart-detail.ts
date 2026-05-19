import type { SharedCartItem } from '@/app/api/carts/route'
import type { CartLine } from '@/context/cart-context'
import { formatMoneyArs, upperCategoryLabel } from '@/lib/format'

export function lineBulletForWhatsApp(
  name: string,
  unitPrice: number,
  quantity: number,
): string {
  const sub = unitPrice * quantity
  return `• ${name} x${quantity} — ${formatMoneyArs(sub)} (${formatMoneyArs(unitPrice)} c/u)`
}

export function formatWhatsAppDetailFromStoreLines(lines: CartLine[]): string {
  if (lines.length === 0) return ''

  const map = new Map<string, { sort: number; title: string; lines: CartLine[] }>()
  for (const l of lines) {
    const key = l.categoryId || `n:${l.categoryName}`
    let g = map.get(key)
    if (!g) {
      g = { sort: l.categorySortOrder, title: l.categoryName, lines: [] }
      map.set(key, g)
    }
    g.lines.push(l)
  }

  return [...map.values()]
    .sort((a, b) => a.sort - b.sort)
    .map((g) => {
      const head = `*${upperCategoryLabel(g.title)}*`
      const body = g.lines.map((l) => lineBulletForWhatsApp(l.name, l.unitPrice, l.quantity)).join('\n')
      return `${head}\n${body}`
    })
    .join('\n\n')
}

export function formatSharedCartWhatsAppDetail(items: SharedCartItem[]): string {
  return items.map((it) => lineBulletForWhatsApp(it.name, it.unit_price, it.quantity)).join('\n')
}
