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
  isActive,
  isEdit,
  justAdded,
  onAdd,
  onOpenDetail,
}: {
  product: FeaturedCarouselProduct
  isLight: boolean
  accentFrame: string
  isActive: boolean
  isEdit?: boolean
  justAdded: boolean
  onAdd: () => void
  onOpenDetail: () => void
}) {
  const frameVar = accentFrame || (isLight ? '#f4f4f5' : '#27272a')
  const cardClass = isLight ? 'store-product-card' : 'store-product-card store-product-card--dark'
  const img = getProductImageUrl(product.image_path, 'full')
  const mediaFocus = imageFocusStyle({ x: product.image_focus_x, y: product.image_focus_y })
  const hasDetail = Boolean(product.product_details?.trim() || product.description?.trim())

  return (
    <article
      className={`${cardClass} featured-products-carousel__card`}
      style={{ ['--shop-product-frame' as string]: frameVar }}
      inert={!isActive ? true : undefined}
    >
      <div className="featured-products-carousel__media-wrap relative">
        <button
          type="button"
          className="block w-full cursor-zoom-in border-0 bg-transparent p-0 text-left"
          onClick={onOpenDetail}
          tabIndex={isActive ? 0 : -1}
          aria-label={`Ver detalle de ${product.name}`}
        >
          {img ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={img}
              alt={product.name}
              className="store-product-card__media featured-products-carousel__media"
              style={mediaFocus}
            />
          ) : (
            <div className="store-product-card__media featured-products-carousel__media rounded-t-2xl bg-zinc-200" />
          )}
          <span className="featured-products-carousel__media-shine" aria-hidden />
        </button>
        {hasDetail && (
          <span className="absolute bottom-3 right-3 rounded-full bg-black/50 px-2.5 py-1 text-[10px] font-medium text-white backdrop-blur-sm">
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
            className={`btn-store-add${justAdded && isActive ? ' btn-store-add--added' : ''}`}
            onClick={onAdd}
            tabIndex={isActive ? 0 : -1}
          >
            <CartAddIcon />
            {justAdded && isActive ? 'Agregado ✓' : 'Agregar al carrito'}
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
  const [reduceMotion, setReduceMotion] = useState(false)
  const trackRef = useRef<HTMLDivElement>(null)
  const slideRefs = useRef<(HTMLDivElement | null)[]>([])
  const addedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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
    if (n <= 1 || paused || reduceMotion) return
    const id = window.setInterval(() => setIndex((i) => (i + 1) % n), INTERVAL_MS)
    return () => window.clearInterval(id)
  }, [n, paused, reduceMotion])

  useEffect(() => {
    const track = trackRef.current
    const slide = slideRefs.current[index]
    if (!track || !slide) return

    const maxLeft = track.scrollWidth - track.clientWidth
    const targetLeft = slide.offsetLeft - (track.clientWidth - slide.offsetWidth) / 2
    track.scrollTo({
      left: Math.max(0, Math.min(targetLeft, maxLeft)),
      behavior: reduceMotion ? 'auto' : 'smooth',
    })
  }, [index, reduceMotion])

  useEffect(() => {
    if (index >= n) setIndex(0)
  }, [index, n])

  if (n === 0) return null

  const handleAdd = (product: FeaturedCarouselProduct) => {
    onAdd(product)
    setJustAddedId(product.id)
    if (addedTimeoutRef.current) clearTimeout(addedTimeoutRef.current)
    addedTimeoutRef.current = setTimeout(() => setJustAddedId(null), 800)
  }

  const pause = () => setPaused(true)
  const resume = () => setPaused(false)

  return (
    <div
      className={`featured-products-carousel ${isLight ? 'featured-products-carousel--light' : 'featured-products-carousel--dark'}`}
      onMouseEnter={pause}
      onMouseLeave={resume}
      onFocusCapture={pause}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) resume()
      }}
      onTouchStart={pause}
      onTouchEnd={() => window.setTimeout(resume, 2800)}
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
          ref={trackRef}
          className="featured-products-carousel__track"
          aria-roledescription="carrusel"
          aria-label="Productos destacados"
        >
          {products.map((product, i) => (
            <div
              key={product.id}
              ref={(el) => {
                slideRefs.current[i] = el
              }}
              className={`featured-products-carousel__slide ${i === index ? 'is-active' : ''}`}
              aria-hidden={i !== index}
            >
              <FeaturedSlide
                product={product}
                isLight={isLight}
                accentFrame={accentFrame}
                isActive={i === index}
                isEdit={isEdit}
                justAdded={justAddedId === product.id}
                onAdd={() => handleAdd(product)}
                onOpenDetail={() => onOpenDetail(product)}
              />
            </div>
          ))}
        </div>
      </div>

      {n > 1 && (
        <div className="featured-products-carousel__footer">
          <div
            className="featured-products-carousel__progress"
            role="presentation"
            aria-hidden
          >
            <span
              key={`${index}-${paused}-${reduceMotion}`}
              className="featured-products-carousel__progress-bar"
              style={
                reduceMotion || paused
                  ? { animationPlayState: 'paused' }
                  : { animationDuration: `${INTERVAL_MS}ms` }
              }
            />
          </div>
          <div className="featured-products-carousel__dots">
            {products.map((p, i) => (
              <button
                key={p.id}
                type="button"
                aria-label={`Ver ${p.name}`}
                aria-current={i === index ? 'true' : undefined}
                onClick={() => goTo(i)}
                className={`featured-products-carousel__dot ${i === index ? 'is-active' : ''}`}
              />
            ))}
          </div>
        </div>
      )}

      {isEdit && n > 1 && (
        <p className="featured-products-carousel__hint">
          Vista previa ({index + 1}/{n}) — en la tienda avanza solo; pasá el mouse para pausar.
        </p>
      )}
    </div>
  )
}
