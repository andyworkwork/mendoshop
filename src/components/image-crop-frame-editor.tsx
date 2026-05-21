'use client'

import { useRef } from 'react'
import { clampFocusPercent, imageFocusStyle, type ImageFocus } from '@/lib/image-focus'

const PAN_SENSITIVITY = 1.35

export function ImageCropFrameEditor({
  imageUrl,
  aspectWidth,
  aspectHeight,
  value,
  onChange,
  disabled,
}: {
  imageUrl: string | null | undefined
  aspectWidth: number
  aspectHeight: number
  value: ImageFocus
  onChange: (next: ImageFocus) => void
  disabled?: boolean
}) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const panRef = useRef<{
    pointerId: number
    startX: number
    startY: number
    focus: ImageFocus
  } | null>(null)

  function onPointerDown(e: React.PointerEvent) {
    if (disabled) return
    e.preventDefault()
    panRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      focus: { ...value },
    }
    viewportRef.current?.setPointerCapture(e.pointerId)
  }

  function onPointerMove(e: React.PointerEvent) {
    const pan = panRef.current
    const el = viewportRef.current
    if (!pan || pan.pointerId !== e.pointerId || !el) return

    const rect = el.getBoundingClientRect()
    if (rect.width <= 0 || rect.height <= 0) return

    const dx = ((e.clientX - pan.startX) / rect.width) * 100 * PAN_SENSITIVITY
    const dy = ((e.clientY - pan.startY) / rect.height) * 100 * PAN_SENSITIVITY

    onChange({
      x: clampFocusPercent(pan.focus.x - dx),
      y: clampFocusPercent(pan.focus.y - dy),
    })
  }

  function onPointerUp(e: React.PointerEvent) {
    if (panRef.current?.pointerId === e.pointerId) {
      panRef.current = null
    }
  }

  if (!imageUrl) {
    return <p className="text-sm text-zinc-500">Subí una imagen para ajustar el encuadre.</p>
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-zinc-400">
        El marco tiene el mismo tamaño que la foto en tu tienda. Arrastrá la imagen para elegir qué parte
        queda visible. Al guardar, se recorta y optimiza a esas medidas.
      </p>

      <div
        ref={viewportRef}
        role="application"
        aria-label="Encuadre de imagen"
        className={`image-crop-viewport relative mx-auto w-full max-w-[min(100%,320px)] touch-none select-none ${
          disabled ? 'pointer-events-none opacity-60' : 'cursor-grab active:cursor-grabbing'
        }`}
        style={{ aspectRatio: `${aspectWidth} / ${aspectHeight}` }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt=""
          draggable={false}
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
          style={imageFocusStyle(value)}
        />
        <div className="image-crop-viewport__grid pointer-events-none absolute inset-0" aria-hidden />
        <div className="image-crop-viewport__frame pointer-events-none absolute inset-0 rounded-[inherit] ring-2 ring-inset ring-white/90" aria-hidden />
      </div>
    </div>
  )
}
