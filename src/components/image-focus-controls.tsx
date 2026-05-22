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
  objectFit = 'cover',
}: {
  value: ImageFocus
  onChange: (next: ImageFocus) => void
  disabled?: boolean
  previewUrl?: string | null
  /** Proporción del marco (ej. banner 2×1). */
  aspectWidth?: number
  aspectHeight?: number
  objectFit?: 'cover' | 'contain'
}) {
  return (
    <ImageCropFrameEditor
      imageUrl={previewUrl}
      aspectWidth={aspectWidth}
      aspectHeight={aspectHeight}
      value={value}
      onChange={onChange}
      disabled={disabled}
      objectFit={objectFit}
    />
  )
}
