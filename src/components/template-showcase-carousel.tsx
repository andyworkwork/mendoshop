'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { TemplateShowcasePreview } from '@/components/template-showcase-preview'
import type { HomeCarouselSlide } from '@/lib/home-carousel'

const INTERVAL_MS = 4400

export function TemplateShowcaseCarousel({ slides }: { slides: HomeCarouselSlide[] }) {
  const n = slides.length
  const [index, setIndex] = useState(0)
  const trackRef = useRef<HTMLDivElement>(null)
  const slideRefs = useRef<(HTMLDivElement | null)[]>([])

  const goTo = useCallback((i: number) => {
    setIndex(((i % n) + n) % n)
  }, [n])

  useEffect(() => {
    if (n <= 1) return
    const id = window.setInterval(() => setIndex((i) => (i + 1) % n), INTERVAL_MS)
    return () => window.clearInterval(id)
  }, [n])

  useEffect(() => {
    const track = trackRef.current
    const slide = slideRefs.current[index]
    if (!track || !slide) return

    const maxLeft = track.scrollWidth - track.clientWidth
    const targetLeft = slide.offsetLeft - (track.clientWidth - slide.offsetWidth) / 2
    track.scrollTo({
      left: Math.max(0, Math.min(targetLeft, maxLeft)),
      behavior: 'smooth',
    })
  }, [index])

  if (n === 0) return null

  return (
    <div className="template-showcase-carousel-wrap mt-8 w-full">
      <p className="hero-text-shadow mb-4 text-center text-sm font-medium uppercase tracking-widest text-zinc-300">
        Tiendas y plantillas en Mendoshop
      </p>

      <div className="relative mx-auto max-w-5xl">
        {n > 1 && (
          <>
            <button
              type="button"
              className="template-showcase-arrow template-showcase-arrow--prev"
              aria-label="Plantilla anterior"
              onClick={() => goTo(index - 1)}
            >
              ‹
            </button>
            <button
              type="button"
              className="template-showcase-arrow template-showcase-arrow--next"
              aria-label="Plantilla siguiente"
              onClick={() => goTo(index + 1)}
            >
              ›
            </button>
          </>
        )}

        <div
          ref={trackRef}
          className="template-showcase-track"
          aria-roledescription="carrusel"
          aria-label="Vista previa de plantillas de tienda"
        >
          {slides.map((slide, i) => (
            <div
              key={slide.key}
              ref={(el) => {
                slideRefs.current[i] = el
              }}
              className={`template-showcase-slide ${i === index ? 'is-active' : ''}`}
              aria-hidden={i !== index}
            >
              <TemplateShowcasePreview
                template={slide.template}
                showcase={slide.showcase}
                theme={slide.theme}
                caption={slide.caption}
              />
            </div>
          ))}
        </div>

        {n > 1 && (
          <div className="mt-4 flex justify-center gap-2">
            {slides.map((slide, i) => (
              <button
                key={slide.key}
                type="button"
                aria-label={slide.caption}
                aria-current={i === index ? 'true' : undefined}
                onClick={() => goTo(i)}
                className={`h-2 rounded-full transition-all ${
                  i === index ? 'w-6 bg-brand' : 'w-2 bg-white/35 hover:bg-white/55'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
