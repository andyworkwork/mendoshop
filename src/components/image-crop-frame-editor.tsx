'use client'

import { useCallback, useEffect, useRef } from 'react'
import { clampFocusPercent, imageFocusStyle, type ImageFocus } from '@/lib/image-focus'

const PAN_SENSITIVITY = 1.15

/**
 * Marco fijo = mismo recorte visual que la vitrina (object-cover + object-position).
 * No genera un archivo nuevo: solo mueve qué parte de la imagen se ve en el banner.
 */
export function ImageCropFrameEditor({
  imageUrl,
  aspectWidth,
  aspectHeight,
  value,
  onChange,
  disabled,
  objectFit = 'cover',
}: {
  imageUrl: string | null | undefined
  aspectWidth: number
  aspectHeight: number
  value: ImageFocus
  onChange: (next: ImageFocus) => void
  disabled?: boolean
  /** Igual que en la vitrina (cover en banner, contain en logo Mendoshop). */
  objectFit?: 'cover' | 'contain'
}) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const panRef = useRef<{
    pointerId: number
    startX: number
    startY: number
    focus: ImageFocus
  } | null>(null)

  const applyPan = useCallback(
    (clientX: number, clientY: number) => {
      if (objectFit === 'contain') return
      const pan = panRef.current
      const el = viewportRef.current
      if (!pan || !el) return

      const rect = el.getBoundingClientRect()
      if (rect.width <= 0 || rect.height <= 0) return

      const dx = ((clientX - pan.startX) / rect.width) * 100 * PAN_SENSITIVITY
      const dy = ((clientY - pan.startY) / rect.height) * 100 * PAN_SENSITIVITY

      onChange({
        x: clampFocusPercent(pan.focus.x - dx),
        y: clampFocusPercent(pan.focus.y - dy),
      })
    },
    [onChange, objectFit],
  )

  useEffect(() => {
    const onPointerMove = (e: PointerEvent) => {
      const pan = panRef.current
      if (!pan || pan.pointerId !== e.pointerId) return
      e.preventDefault()
      applyPan(e.clientX, e.clientY)
    }

    const endPan = (e: PointerEvent) => {
      const pan = panRef.current
      if (!pan || pan.pointerId !== e.pointerId) return
      panRef.current = null
    }

    document.addEventListener('pointermove', onPointerMove, { passive: false })
    document.addEventListener('pointerup', endPan)
    document.addEventListener('pointercancel', endPan)
    return () => {
      document.removeEventListener('pointermove', onPointerMove)
      document.removeEventListener('pointerup', endPan)
      document.removeEventListener('pointercancel', endPan)
    }
  }, [applyPan])

  function onPointerDown(e: React.PointerEvent) {
    if (disabled || objectFit === 'contain') return
    if (e.button !== 0) return
    e.preventDefault()
    e.stopPropagation()

    panRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      focus: { x: value.x, y: value.y },
    }

    try {
      viewportRef.current?.setPointerCapture(e.pointerId)
    } catch {
      /* setPointerCapture puede fallar en algunos navegadores */
    }
  }

  if (!imageUrl) {
    return <p className="text-sm text-zinc-500">Subí una imagen para elegir la vista del banner.</p>
  }

  const isContain = objectFit === 'contain'

  return (
    <div className="space-y-3">
      <p className="text-xs text-zinc-400">
        {isContain
          ? 'Esta imagen se muestra completa en el banner (no hace falta encuadrar).'
          : 'El recuadro es lo que verán en tu tienda. Arrastrá la imagen para elegir qué parte queda visible (no se recorta el archivo).'}
      </p>

      <div
        ref={viewportRef}
        role="application"
        aria-label="Vista del banner"
        onPointerDown={onPointerDown}
        className={`image-crop-viewport relative mx-auto w-full max-w-[min(100%,360px)] touch-none select-none overflow-hidden ${
          isContain ? 'bg-zinc-950' : ''
        } ${disabled ? 'pointer-events-none opacity-60' : isContain ? '' : 'cursor-grab active:cursor-grabbing'}`}
        style={{ aspectRatio: `${aspectWidth} / ${aspectHeight}`, touchAction: 'none' }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt=""
          draggable={false}
          className={`pointer-events-none absolute inset-0 h-full w-full select-none ${
            isContain ? 'object-contain p-4' : 'object-cover'
          }`}
          style={isContain ? undefined : imageFocusStyle(value)}
        />
        {!isContain ? (
          <>
            <div className="image-crop-viewport__grid pointer-events-none absolute inset-0" aria-hidden />
            <div
              className="image-crop-viewport__frame pointer-events-none absolute inset-0 rounded-[inherit] ring-2 ring-inset ring-white/90"
              aria-hidden
            />
          </>
        ) : null}
      </div>
    </div>
  )
}
