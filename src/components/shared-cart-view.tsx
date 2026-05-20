'use client'

import { formatMoneyArs } from '@/lib/format'
import { getProductImageUrl } from '@/lib/product-images'
import { buildWhatsAppUrl } from '@/lib/shops'
import { formatSharedCartWhatsAppDetail } from '@/lib/whatsapp-cart-detail'
import type { SharedCartItem } from '@/app/api/carts/route'
import type { ShopRow } from '@/types/shop'

type ProductSnap = {
  id: string
  name: string
  image_path: string | null
}

export function SharedCartView({
  shop,
  items,
  cartUrl,
}: {
  shop: ShopRow
  items: SharedCartItem[]
  cartUrl: string
}) {
  const total = items.reduce((s, i) => s + i.unit_price * i.quantity, 0)
  const detail = formatSharedCartWhatsAppDetail(items)
  const msg = [
    `Pedido en *${shop.name}*`,
    '',
    detail,
    '',
    `Total: ${formatMoneyArs(total)}`,
    '',
    `Link: ${cartUrl}`,
  ].join('\n')

  return (
    <div className="mx-auto max-w-lg space-y-4 p-4">
      <h1 className="text-xl font-bold">Carrito guardado — {shop.name}</h1>
      <ul className="space-y-2">
        {items.map((it, idx) => (
          <li key={idx} className="card flex justify-between text-sm">
            <span>
              {it.name} x{it.quantity}
            </span>
            <span>{formatMoneyArs(it.unit_price * it.quantity)}</span>
          </li>
        ))}
      </ul>
      <p className="font-semibold">Total: {formatMoneyArs(total)}</p>
      <a href={buildWhatsAppUrl(shop.whatsapp_e164, msg)} className="btn-accent block text-center py-3">
        Abrir WhatsApp del vendedor
      </a>
    </div>
  )
}

export function productImageUrl(p: ProductSnap): string | null {
  return getProductImageUrl(p.image_path, 'thumb')
}
