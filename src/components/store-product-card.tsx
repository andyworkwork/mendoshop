'use client'

import { useRef, useState } from 'react'
import { imageFocusStyle } from '@/lib/image-focus'
import { formatMoneyArs } from '@/lib/format'
import { getProductImageUrl } from '@/lib/product-images'
import type { ProductRow } from '@/types/catalog'

function CartAddIcon() {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.25} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2 9m12-9l2 9m-6-9V6a2 2 0 012-2h0a2 2 0 012 2v7"
      />
    </svg>
  )
}

export function StoreProductCard({
  product: p,
  isLight,
  accentFrame,
  isEdit,
  onAdd,
  onOpenDetail,
  embedded,
  className = '',
}: {
  product: ProductRow
  isLight: boolean
  accentFrame: string
  isEdit?: boolean
  onAdd: () => void
  onOpenDetail: () => void
  /** Dentro de un slide del carrusel (sin `<li>` propio). */
  embedded?: boolean
  className?: string
}) {
  const [justAdded, setJustAdded] = useState(false)
  const addedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const img = getProductImageUrl(p.image_path, 'thumb', p.updated_at)
  const inStock = p.stock_quantity > 0
  const cardClass = isLight ? 'store-product-card' : 'store-product-card store-product-card--dark'
  const Tag = embedded ? 'article' : 'li'

  const handleAdd = () => {
    if (!inStock) return
    onAdd()
    setJustAdded(true)
    if (addedTimeoutRef.current) clearTimeout(addedTimeoutRef.current)
    addedTimeoutRef.current = setTimeout(() => setJustAdded(false), 800)
  }

  const label = justAdded ? 'Agregado ✓' : 'Agregar al carrito'
  const frameVar = accentFrame || (isLight ? '#f4f4f5' : '#27272a')
  const mediaFocus = imageFocusStyle({ x: p.image_focus_x, y: p.image_focus_y })

  return (
    <Tag
      className={`${cardClass}${className ? ` ${className}` : ''}`}
      style={{ ['--shop-product-frame' as string]: frameVar }}
    >
      <div className="relative">
        <button
          type="button"
          className="block w-full cursor-zoom-in border-0 bg-transparent p-0 text-left"
          onClick={onOpenDetail}
          aria-label={`Ver detalle de ${p.name}`}
        >
          {img ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={img}
              alt={p.name}
              loading="lazy"
              decoding="async"
              className="store-product-card__media"
              style={mediaFocus}
            />
          ) : (
            <div className="store-product-card__media rounded-t-2xl bg-zinc-200" />
          )}
        </button>
        {(p.product_details?.trim() || p.description?.trim()) && (
          <span className="absolute bottom-2 right-2 rounded-md bg-black/55 px-1.5 py-0.5 text-[10px] font-medium text-white">
            Ver más
          </span>
        )}
      </div>
      <div className="store-product-card__body">
        <div>
          <p className="store-product-card__caption-name">{p.name}</p>
          <p className="store-product-card__caption-price">{formatMoneyArs(Number(p.price))}</p>
        </div>
        {!isEdit &&
          (inStock ? (
            <button
              type="button"
              className={`btn-store-add${justAdded ? ' btn-store-add--added' : ''}`}
              onClick={handleAdd}
            >
              <CartAddIcon />
              {label}
            </button>
          ) : (
            <button type="button" className="btn-store-add opacity-70 cursor-not-allowed" disabled>
              Agotado
            </button>
          ))}
      </div>
    </Tag>
  )
}
