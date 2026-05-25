'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { imageFocusStyle } from '@/lib/image-focus'
import { formatMoneyArs } from '@/lib/format'
import { getProductImageUrl } from '@/lib/product-images'

const INTERVAL_MS = 4000

export type FeaturedCarouselProduct = {
  id: string
  name: string
  price: number
  image_path: string | null
  image_focus_x: number
  image_focus_y: number
  product_details: string | null
  description: string | null
}

function CartAddIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  )
}

function CarouselChevron({ direction }: { direction: 'prev' | 'next' }) {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {direction === 'prev' ? <path d="M15 6l-6 6 6 6" /> : <path d="M9 6l6 6-6 6" />}
    </svg>
  )
}

function FeaturedSlide({
  product,
  isLight,
  accentFrame,
  isEdit,
  justAdded,
  onAdd,
  onOpenDetail,
}: {
  product: FeaturedCarouselProduct
  isLight: boolean
  accentFrame: string
  isEdit?: boolean
  justAdded: boolean
  onAdd: () => void
  onOpenDetail: () => void
}) {
  const frameVar = accentFrame || (isLight ? '#f4f4f5' : '#27272a')
  const cardClass = isLight ? 'store-product-card' : 'store-product-card store-product-card--dark'
  const img = getProductImageUrl(product.image_path, 'thumb')
  const mediaFocus = imageFocusStyle({ x: product.image_focus_x, y: product.image_focus_y })
  const hasDetail = Boolean(product.product_details?.trim() || product.description?.trim())

  return (
    <article
      className={`${cardClass} featured-products-carousel__card`}
      style={{ ['--shop-product-frame' as string]: frameVar }}
    >
      <div className="featured-products-carousel__media-wrap relative">
        <button
          type="button"
          className="block w-full cursor-zoom-in border-0 bg-transparent p-0 text-left"
          onClick={onOpenDetail}
          aria-label={`Ver detalle de ${product.name}`}
        >
          {img ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={img}
              alt={product.name}
              className="store-product-card__media featured-products-carousel__media"
              style={mediaFocus}
              decoding="async"
            />
          ) : (
            <div className="store-product-card__media featured-products-carousel__media rounded-t-2xl bg-zinc-200" />
          )}
        </button>
        {hasDetail && (
          <span className="absolute bottom-3 right-3 rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-medium text-white">
            Ver más
          </span>
        )}
      </div>
      <div className="store-product-card__body">
        <div>
          <p className="store-product-card__caption-name">{product.name}</p>
          <p className="store-product-card__caption-price">{formatMoneyArs(Number(product.price))}</p>
        </div>
        {!isEdit && (
          <button
            type="button"
            className={`btn-store-add${justAdded ? ' btn-store-add--added' : ''}`}
            onClick={onAdd}
          >
            <CartAddIcon />
            {justAdded ? 'Agregado ✓' : 'Agregar al carrito'}
          </button>
        )}
      </div>
    </article>
  )
}

export function FeaturedProductsCarousel({
  products,
  isLight,
  accentFrame,
  isEdit,
  onAdd,
  onOpenDetail,
}: {
  products: FeaturedCarouselProduct[]
  isLight: boolean
  accentFrame: string
  isEdit?: boolean
  onAdd: (product: FeaturedCarouselProduct) => void
  onOpenDetail: (product: FeaturedCarouselProduct) => void
}) {
  const n = products.length
  const [index, setIndex] = useState(0)
  const [justAddedId, setJustAddedId] = useState<string | null>(null)
  const [paused, setPaused] = useState(false)
  const [inView, setInView] = useState(true)
  const [reduceMotion, setReduceMotion] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const addedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const resumeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const goTo = useCallback(
    (i: number) => {
      setIndex(((i % n) + n) % n)
    },
    [n],
  )

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduceMotion(mq.matches)
    const onChange = () => setReduceMotion(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    const el = rootRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const obs = new IntersectionObserver(
      ([entry]) => setInView(entry?.isIntersecting ?? true),
      { rootMargin: '80px', threshold: 0.15 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    if (n <= 1 || paused || !inView || reduceMotion) return
    const id = window.setInterval(() => setIndex((i) => (i + 1) % n), INTERVAL_MS)
    return () => window.clearInterval(id)
  }, [n, paused, inView, reduceMotion])

  useEffect(() => {
    if (index >= n) setIndex(0)
  }, [index, n])

  if (n === 0) return null

  const product = products[index]!

  const handleAdd = (p: FeaturedCarouselProduct) => {
    onAdd(p)
    setJustAddedId(p.id)
    if (addedTimeoutRef.current) clearTimeout(addedTimeoutRef.current)
    addedTimeoutRef.current = setTimeout(() => setJustAddedId(null), 800)
  }

  const pause = () => {
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current)
    setPaused(true)
  }

  const resumeLater = (ms: number) => {
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current)
    resumeTimeoutRef.current = setTimeout(() => setPaused(false), ms)
  }

  return (
    <div
      ref={rootRef}
      className={`featured-products-carousel ${isLight ? 'featured-products-carousel--light' : 'featured-products-carousel--dark'}`}
      onMouseEnter={pause}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={pause}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setPaused(false)
      }}
      onTouchStart={pause}
      onTouchEnd={() => resumeLater(2400)}
    >
      <div className="featured-products-carousel__viewport">
        {n > 1 && (
          <>
            <button
              type="button"
              className="featured-products-carousel__arrow featured-products-carousel__arrow--prev"
              aria-label="Producto anterior"
              onClick={() => goTo(index - 1)}
            >
              <CarouselChevron direction="prev" />
            </button>
            <button
              type="button"
              className="featured-products-carousel__arrow featured-products-carousel__arrow--next"
              aria-label="Producto siguiente"
              onClick={() => goTo(index + 1)}
            >
              <CarouselChevron direction="next" />
            </button>
          </>
        )}

        <div
          className="featured-products-carousel__stage"
          aria-roledescription="carrusel"
          aria-label="Productos destacados"
          aria-live="polite"
        >
          <div key={product.id} className="featured-products-carousel__slide-enter">
            <FeaturedSlide
              product={product}
              isLight={isLight}
              accentFrame={accentFrame}
              isEdit={isEdit}
              justAdded={justAddedId === product.id}
              onAdd={() => handleAdd(product)}
              onOpenDetail={() => onOpenDetail(product)}
            />
          </div>
        </div>
      </div>

      {n > 1 && (
        <div className="featured-products-carousel__footer">
          <div className="featured-products-carousel__progress" aria-hidden>
            <span
              key={`${index}-${paused}-${inView}-${reduceMotion}`}
              className="featured-products-carousel__progress-bar"
              style={
                reduceMotion || paused || !inView
                  ? { animationPlayState: 'paused' as const }
                  : { animationDuration: `${INTERVAL_MS}ms` }
              }
            />
          </div>
          <div className="featured-products-carousel__dots" role="tablist" aria-label="Elegir producto destacado">
            {products.map((p, i) => (
              <button
                key={p.id}
                type="button"
                role="tab"
                aria-label={`Ver ${p.name}`}
                aria-selected={i === index}
                onClick={() => goTo(i)}
                className={`featured-products-carousel__dot ${i === index ? 'is-active' : ''}`}
              />
            ))}
          </div>
        </div>
      )}

      {isEdit && n > 1 && (
        <p className="featured-products-carousel__hint">
          Vista previa ({index + 1}/{n}) — en la tienda avanza solo cada 4 s.
        </p>
      )}
    </div>
  )
}
