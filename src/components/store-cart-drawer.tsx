'use client'

import type { CSSProperties } from 'react'
import { useState } from 'react'
import { useCart } from '@/context/cart-context'
import { formatMoneyArs } from '@/lib/format'
import { appBaseUrl } from '@/lib/publicUrl'
import { buildWhatsAppUrl } from '@/lib/shops'
import { formatWhatsAppDetailFromStoreLines } from '@/lib/whatsapp-cart-detail'
import type { SharedCartItem } from '@/app/api/carts/route'
import type { ShopRow } from '@/types/shop'
import { getProductImageUrl } from '@/lib/product-images'

type Props = {
  shop: ShopRow
  open: boolean
  onClose: () => void
  themeStyle: CSSProperties
}

export function StoreCartDrawer({ shop, open, onClose, themeStyle }: Props) {
  const { lines, removeLine, setQty, subtotal, clear } = useCart()
  const [sending, setSending] = useState(false)

  async function handleComprar() {
    if (lines.length === 0) return
    setSending(true)
    try {
      const items: SharedCartItem[] = lines.map((l) => ({
        product_id: l.productId,
        name: l.name,
        unit_price: l.unitPrice,
        quantity: l.quantity,
        category_id: l.categoryId,
        category_name: l.categoryName,
        category_sort_order: l.categorySortOrder,
      }))
      const res = await fetch('/api/carts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shop_id: shop.id, items }),
      })
      const js = (await res.json()) as { id?: string; token?: string; error?: string }
      if (!res.ok || !js.id || !js.token) throw new Error(js.error ?? 'Error')

      const cartUrl = `${appBaseUrl()}/tienda/${shop.slug}/c/${js.id}?t=${encodeURIComponent(js.token)}`
      const detail = formatWhatsAppDetailFromStoreLines(lines)
      const msg = [
        `Hola! Quiero comprar en *${shop.name}*:`,
        '',
        detail,
        '',
        `*Total: ${formatMoneyArs(subtotal)}*`,
        '',
        `Ver mi carrito: ${cartUrl}`,
      ].join('\n')

      clear()
      onClose()
      window.location.assign(buildWhatsAppUrl(shop.whatsapp_e164, msg))
    } catch (e) {
      console.error(e)
      alert('No se pudo preparar WhatsApp.')
    } finally {
      setSending(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex bg-black/60" style={themeStyle}>
      <button
        type="button"
        className="min-h-0 min-w-0 flex-1 cursor-default border-0 bg-transparent"
        aria-label="Cerrar"
        onClick={onClose}
      />
      <aside className="store-cart-drawer flex h-full w-full max-w-md flex-col shadow-2xl">
        <div className="store-cart-drawer__header flex items-center justify-between px-4 py-3">
          <h2 className="store-vitrina-title-text font-semibold">Tu carrito</h2>
          <button type="button" onClick={onClose} className="store-cart-drawer__close rounded p-2">
            ✕
          </button>
        </div>
        <ul className="flex-1 overflow-y-auto p-4 space-y-3">
          {lines.length === 0 && (
            <li className="store-cart-drawer__empty py-8 text-center">El carrito está vacío</li>
          )}
          {lines.map((l) => {
            const img = getProductImageUrl(l.imagePath, 'thumb')
            return (
              <li key={l.productId} className="store-cart-drawer__item flex gap-3 rounded-xl p-2">
                {img ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={img} alt="" className="h-16 w-16 rounded-lg object-cover" />
                ) : (
                  <div className="h-16 w-16 rounded-lg bg-zinc-800/80" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="store-vitrina-title-text truncate text-sm font-medium">{l.name}</p>
                  <p className="store-product-card__caption-price text-sm">{formatMoneyArs(l.unitPrice)}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      className="store-cart-drawer__qty-btn h-8 w-8 rounded"
                      onClick={() => setQty(l.productId, l.quantity - 1)}
                      aria-label="Quitar una unidad"
                    >
                      −
                    </button>
                    <span className="store-cart-drawer__qty w-6 text-center text-sm">{l.quantity}</span>
                    <button
                      type="button"
                      className="store-cart-drawer__qty-btn h-8 w-8 rounded"
                      onClick={() => setQty(l.productId, l.quantity + 1)}
                      aria-label="Agregar una unidad"
                    >
                      +
                    </button>
                    <button
                      type="button"
                      className="store-cart-drawer__remove ml-auto text-xs"
                      onClick={() => removeLine(l.productId)}
                    >
                      Quitar
                    </button>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
        <div className="store-cart-drawer__footer space-y-3 p-4">
          <p className="store-vitrina-title-text flex justify-between font-semibold">
            <span>Total</span>
            <span>{formatMoneyArs(subtotal)}</span>
          </p>
          <button
            type="button"
            disabled={lines.length === 0 || sending}
            onClick={handleComprar}
            className="btn-accent w-full py-3 disabled:opacity-50"
          >
            {sending ? 'Preparando…' : 'Comprar por WhatsApp'}
          </button>
        </div>
      </aside>
    </div>
  )
}
