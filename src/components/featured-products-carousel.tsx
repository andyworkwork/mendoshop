'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { StoreProductCard } from '@/components/store-product-card'
import type { FlatProduct } from '@/lib/flat-product'

const INTERVAL_MS = 3000
const SCROLL_IDLE_MS = 180

export function FeaturedProductsCarousel({
  products,
  isLight,
  accentFrame,
  isEdit,
  onAdd,
  onOpenDetail,
}: {
  products: FlatProduct[]
  isLight: boolean
  accentFrame: string
  isEdit?: boolean
  onAdd: (product: FlatProduct) => void
  onOpenDetail: (product: FlatProduct) => void
}) {
  const n = products.length
  const [index, setIndex] = useState(0)
  const [userScrolling, setUserScrolling] = useState(false)
  const [paused, setPaused] = useState(false)
  const [inView, setInView] = useState(true)
  const [reduceMotion, setReduceMotion] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLUListElement>(null)
  const slideRefs = useRef<(HTMLLIElement | null)[]>([])
  const programmaticScrollRef = useRef(false)
  const scrollIdleRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const resumeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const goTo = useCallback(
    (i: number) => {
      setIndex(((i % n) + n) % n)
    },
    [n],
  )

  const syncIndexFromScroll = useCallback(() => {
    const track = trackRef.current
    if (!track || n === 0) return
    const center = track.scrollLeft + track.clientWidth / 2
    let best = 0
    let bestDist = Infinity
    for (let i = 0; i < n; i++) {
      const slide = slideRefs.current[i]
      if (!slide) continue
      const slideCenter = slide.offsetLeft + slide.offsetWidth / 2
      const dist = Math.abs(slideCenter - center)
      if (dist < bestDist) {
        bestDist = dist
        best = i
      }
    }
    setIndex(best)
  }, [n])

  const handleTrackScroll = useCallback(() => {
    if (programmaticScrollRef.current) return
    setUserScrolling(true)
    syncIndexFromScroll()
    if (scrollIdleRef.current) clearTimeout(scrollIdleRef.current)
    scrollIdleRef.current = setTimeout(() => setUserScrolling(false), SCROLL_IDLE_MS)
  }, [syncIndexFromScroll])

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
      ([entry]) => {
        if (!entry) return
        setInView(entry.isIntersecting && entry.intersectionRatio >= 0.35)
      },
      { root: null, rootMargin: '0px', threshold: [0, 0.15, 0.35, 0.5, 0.75, 1] },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    if (n <= 1 || paused || userScrolling || !inView || reduceMotion) return
    const id = window.setInterval(() => setIndex((i) => (i + 1) % n), INTERVAL_MS)
    return () => window.clearInterval(id)
  }, [n, paused, userScrolling, inView, reduceMotion])

  useEffect(() => {
    const track = trackRef.current
    const slide = slideRefs.current[index]
    if (!track || !slide || userScrolling) return

    const maxLeft = track.scrollWidth - track.clientWidth
    const targetLeft = slide.offsetLeft - (track.clientWidth - slide.offsetWidth) / 2
    programmaticScrollRef.current = true
    track.scrollTo({
      left: Math.max(0, Math.min(targetLeft, maxLeft)),
      behavior: reduceMotion ? 'auto' : 'smooth',
    })
    const t = window.setTimeout(() => {
      programmaticScrollRef.current = false
    }, 450)
    return () => window.clearTimeout(t)
  }, [index, userScrolling, reduceMotion])

  useEffect(() => {
    if (index >= n) setIndex(0)
  }, [index, n])

  useEffect(() => {
    return () => {
      if (scrollIdleRef.current) clearTimeout(scrollIdleRef.current)
      if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current)
    }
  }, [])

  if (n === 0) return null

  const pause = () => {
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current)
    setPaused(true)
  }

  return (
    <div
      ref={rootRef}
      className={`featured-products-carousel ${isLight ? 'featured-products-carousel--light' : 'featured-products-carousel--dark'}`}
      onMouseEnter={pause}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={pause}
      onTouchEnd={() => {
        if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current)
        resumeTimeoutRef.current = setTimeout(() => setPaused(false), 2400)
      }}
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
              ‹
            </button>
            <button
              type="button"
              className="featured-products-carousel__arrow featured-products-carousel__arrow--next"
              aria-label="Producto siguiente"
              onClick={() => goTo(index + 1)}
            >
              ›
            </button>
          </>
        )}

        <ul
          ref={trackRef}
          className="featured-products-carousel__track"
          aria-roledescription="carrusel"
          aria-label="Productos destacados"
          onScroll={handleTrackScroll}
        >
          {products.map((product, i) => (
            <li
              key={product.id}
              ref={(el) => {
                slideRefs.current[i] = el
              }}
              className={`featured-products-carousel__slide ${i === index ? 'is-active' : ''}`}
              aria-hidden={i !== index}
            >
              <StoreProductCard
                embedded
                product={product}
                isLight={isLight}
                accentFrame={accentFrame}
                isEdit={isEdit}
                onAdd={() => onAdd(product)}
                onOpenDetail={() => onOpenDetail(product)}
              />
            </li>
          ))}
        </ul>
      </div>

      {n > 1 && (
        <div className="mt-3 flex justify-center gap-2">
          {products.map((p, i) => (
            <button
              key={p.id}
              type="button"
              aria-label={`Ver ${p.name}`}
              aria-current={i === index ? 'true' : undefined}
              onClick={() => goTo(i)}
              className={`h-2 rounded-full transition-all ${
                i === index ? 'w-6 bg-brand' : 'w-2 bg-zinc-500/60 hover:bg-zinc-400'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
