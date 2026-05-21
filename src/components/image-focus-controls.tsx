'use client'

import { ImageCropFrameEditor } from '@/components/image-crop-frame-editor'
import type { ImageFocus } from '@/lib/image-focus'

export function ImageFocusControls({
  value,
  onChange,
  disabled,
  previewUrl,
  aspectWidth = 5,
  aspectHeight = 4,
}: {
  value: ImageFocus
  onChange: (next: ImageFocus) => void
  disabled?: boolean
  previewUrl?: string | null
  /** Proporción del recuadre (ej. banner 2×1, producto 5×4). */
  aspectWidth?: number
  aspectHeight?: number
}) {
  return (
    <ImageCropFrameEditor
      imageUrl={previewUrl}
      aspectWidth={aspectWidth}
      aspectHeight={aspectHeight}
      value={value}
      onChange={onChange}
      disabled={disabled}
    />
  )
}
