'use client'

import { useEffect } from 'react'
import { formatMoneyArs } from '@/lib/format'
import { getProductImageUrl } from '@/lib/product-images'
import { imageFocusStyle } from '@/lib/image-focus'
import { recordProductDetailView } from '@/app/actions/analytics'
import type { ProductRow } from '@/types/catalog'

type Props = {
  product: ProductRow
  shopId: string
  isLight: boolean
  accentFrame: string
  open: boolean
  onClose: () => void
  onAdd: () => void
}

export function ProductDetailModal({
  product,
  shopId,
  isLight,
  accentFrame,
  open,
  onClose,
  onAdd,
}: Props) {
  const img = getProductImageUrl(product.image_path, 'full')
  const details = product.product_details?.trim()
  const frameVar = accentFrame || (isLight ? '#f4f4f5' : '#27272a')

  useEffect(() => {
    if (!open) return
    void recordProductDetailView(shopId, product.id)
  }, [open, shopId, product.id])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center p-0 sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/70"
        aria-label="Cerrar"
        onClick={onClose}
      />
      <div
        className="relative z-10 flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-zinc-700 bg-zinc-950 shadow-2xl sm:rounded-2xl"
        style={{ ['--shop-product-frame' as string]: frameVar }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-detail-title"
      >
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
          <h2 id="product-detail-title" className="font-semibold text-white truncate pr-2">
            {product.name}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>
        <div className="overflow-y-auto">
          {img ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={img}
              alt={product.name}
              className="w-full max-h-[50vh] object-cover"
              style={imageFocusStyle({ x: product.image_focus_x, y: product.image_focus_y })}
            />
          ) : (
            <div className="h-48 w-full bg-zinc-800" />
          )}
          <div className="space-y-3 p-4">
            <p className="text-2xl font-bold text-brand">{formatMoneyArs(Number(product.price))}</p>
            {product.description?.trim() && (
              <p className="text-sm text-zinc-300">{product.description}</p>
            )}
            {details ? (
              <div className="rounded-xl border border-zinc-700/80 bg-zinc-900/60 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 mb-1">
                  Detalles
                </p>
                <p className="text-sm text-zinc-200 whitespace-pre-wrap">{details}</p>
              </div>
            ) : (
              <p className="text-sm text-zinc-500">Sin detalles adicionales.</p>
            )}
            <button type="button" className="btn-accent w-full py-3" onClick={onAdd}>
              Agregar al carrito
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
