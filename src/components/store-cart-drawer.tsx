'use client'

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
}

export function StoreCartDrawer({ shop, open, onClose }: Props) {
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
      const js = (await res.json()) as { id?: string; error?: string }
      if (!res.ok || !js.id) throw new Error(js.error ?? 'Error')

      const cartUrl = `${appBaseUrl()}/tienda/${shop.slug}/c/${js.id}`
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
    <div className="fixed inset-0 z-50 flex bg-black/60">
      <button
        type="button"
        className="min-h-0 min-w-0 flex-1 cursor-default border-0 bg-transparent"
        aria-label="Cerrar"
        onClick={onClose}
      />
      <aside className="flex h-full w-full max-w-md flex-col border-l border-zinc-700 bg-zinc-950 shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
          <h2 className="font-semibold">Tu carrito</h2>
          <button type="button" onClick={onClose} className="rounded p-2 text-zinc-400 hover:bg-zinc-800">
            ✕
          </button>
        </div>
        <ul className="flex-1 overflow-y-auto p-4 space-y-3">
          {lines.length === 0 && (
            <li className="text-center text-zinc-500 py-8">El carrito está vacío</li>
          )}
          {lines.map((l) => {
            const img = getProductImageUrl(l.imagePath, 'thumb')
            return (
              <li key={l.productId} className="flex gap-3 rounded-xl border border-zinc-800 p-2">
                {img ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={img} alt="" className="h-16 w-16 rounded-lg object-cover" />
                ) : (
                  <div className="h-16 w-16 rounded-lg bg-zinc-800" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-sm">{l.name}</p>
                  <p className="text-sm text-brand">{formatMoneyArs(l.unitPrice)}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      className="h-8 w-8 rounded border border-zinc-600"
                      onClick={() => setQty(l.productId, l.quantity - 1)}
                    >
                      −
                    </button>
                    <span className="w-6 text-center text-sm">{l.quantity}</span>
                    <button
                      type="button"
                      className="h-8 w-8 rounded border border-zinc-600"
                      onClick={() => setQty(l.productId, l.quantity + 1)}
                    >
                      +
                    </button>
                    <button
                      type="button"
                      className="ml-auto text-xs text-red-400"
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
        <div className="border-t border-zinc-800 p-4 space-y-3">
          <p className="flex justify-between font-semibold">
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
