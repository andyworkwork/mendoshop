'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { HERO_CAROUSEL_SLIDES } from '@/lib/store-templates'

const INTERVAL_MS = 5500

export function HeroMobileCarousel() {
  const [index, setIndex] = useState(0)
  const n = HERO_CAROUSEL_SLIDES.length

  useEffect(() => {
    if (n <= 1) return
    const id = window.setInterval(() => setIndex((i) => (i + 1) % n), INTERVAL_MS)
    return () => window.clearInterval(id)
  }, [n])

  if (n === 0) return null

  return (
    <div className="relative h-full w-full md:hidden">
      {HERO_CAROUSEL_SLIDES.map((slide, i) => (
        <Image
          key={slide.src}
          src={slide.src}
          alt={slide.alt}
          fill
          priority={i === 0}
          fetchPriority={i === 0 ? 'high' : 'low'}
          sizes="(max-width: 767px) 100vw, 0px"
          quality={92}
          unoptimized
          className={`mendoshop-page-bg__img transition-opacity duration-700 ${
            i === index ? 'opacity-100' : 'opacity-0'
          }`}
        />
      ))}
      {n > 1 && (
        <div className="absolute bottom-3 left-0 right-0 z-10 flex justify-center gap-1.5">
          {HERO_CAROUSEL_SLIDES.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Slide ${i + 1}`}
              onClick={() => setIndex(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === index ? 'w-5 bg-white' : 'w-1.5 bg-white/45'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
