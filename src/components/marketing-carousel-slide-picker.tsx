'use client'

import { useRef, useState, useTransition } from 'react'
import { saveCarouselSlideToLibraryAdmin } from '@/app/actions/admin-marketing'
import { TemplateShowcasePreview } from '@/components/template-showcase-preview'
import {
  assetBelongsToCarouselSlide,
  type MarketingCarouselSlidePayload,
} from '@/lib/marketing-carousel-slides'
import type { MarketingAsset } from '@/lib/marketing'
import { getStoreTemplateOrDefault } from '@/lib/store-templates'

type Props = {
  slides: MarketingCarouselSlidePayload[]
  assets: MarketingAsset[]
  onAssetAdded: (asset: MarketingAsset) => void
  onFlash: (ok: string | null, err?: string | null) => void
}

export function MarketingCarouselSlidePicker({ slides, assets, onAssetAdded, onFlash }: Props) {
  const [pending, startTransition] = useTransition()
  const [capturingKey, setCapturingKey] = useState<string | null>(null)
  const phoneRefs = useRef<Record<string, HTMLDivElement | null>>({})

  async function capturePhoneElement(slideKey: string): Promise<Blob | null> {
    const wrap = phoneRefs.current[slideKey]
    const phone = wrap?.querySelector('.template-showcase-phone') as HTMLElement | null
    if (!phone) return null

    const { default: html2canvas } = await import('html2canvas-pro')
    const canvas = await html2canvas(phone, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#0a0a0a',
      logging: false,
    })

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/webp', 0.9)
    })
  }

  function handleAdd(slide: MarketingCarouselSlidePayload) {
    setCapturingKey(slide.key)
    onFlash(null, null)

    startTransition(async () => {
      try {
        const blob = await capturePhoneElement(slide.key)
        if (!blob) {
          onFlash(null, 'No se pudo capturar la vitrina. Intentá de nuevo.')
          return
        }

        const fd = new FormData()
        fd.append('slideKey', slide.key)
        fd.append('title', slide.caption)
        fd.append('rubro', slide.rubro)
        fd.append('kind', slide.kind)
        fd.append('file', blob, `${slide.key}.webp`)

        const res = await saveCarouselSlideToLibraryAdmin(fd)
        if ('error' in res) {
          onFlash(null, res.error)
          return
        }

        if (res.asset) onAssetAdded(res.asset)
        onFlash(res.alreadyHad ? 'Esa vitrina ya estaba en la biblioteca.' : 'Vitrina del carrusel guardada en biblioteca.')
      } catch (e) {
        onFlash(null, e instanceof Error ? e.message : 'Error al capturar la vitrina.')
      } finally {
        setCapturingKey(null)
      }
    })
  }

  if (slides.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        No hay slides en el carrusel de inicio. Configurá plantillas o tiendas en Plantillas home.
      </p>
    )
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {slides.map((slide) => {
        const template = getStoreTemplateOrDefault(slide.templateId)
        const inLibrary = assets.some((a) => assetBelongsToCarouselSlide(a, slide.key))
        const busy = pending && capturingKey === slide.key

        return (
          <article key={slide.key} className="card space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium text-white">{slide.caption}</p>
                <p className="text-xs text-zinc-500">
                  {slide.kind === 'shop' ? 'Tienda real' : 'Plantilla'} · {slide.templateName}
                </p>
              </div>
            </div>

            <div
              ref={(el) => {
                phoneRefs.current[slide.key] = el
              }}
              className="flex justify-center rounded-lg border border-zinc-800 bg-zinc-950/80 py-3"
            >
              <TemplateShowcasePreview
                template={template}
                showcase={slide.showcase}
                theme={slide.theme}
                caption={slide.caption}
              />
            </div>

            <button
              type="button"
              disabled={pending || inLibrary}
              onClick={() => handleAdd(slide)}
              className="btn-secondary-outline w-full py-2 text-sm disabled:opacity-50"
            >
              {busy ? 'Capturando…' : inLibrary ? 'Ya en biblioteca' : 'Guardar vitrina en biblioteca'}
            </button>
          </article>
        )
      })}
    </div>
  )
}
