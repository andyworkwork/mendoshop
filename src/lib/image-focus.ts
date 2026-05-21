import type { CSSProperties } from 'react'

export type ImageFocus = {
  x: number
  y: number
}

export const DEFAULT_IMAGE_FOCUS: ImageFocus = { x: 50, y: 50 }

export function clampFocusPercent(value: number): number {
  if (!Number.isFinite(value)) return 50
  return Math.min(100, Math.max(0, Math.round(value)))
}

export function normalizeImageFocus(
  x: number | null | undefined,
  y: number | null | undefined,
): ImageFocus {
  return {
    x: clampFocusPercent(x ?? 50),
    y: clampFocusPercent(y ?? 50),
  }
}

export function imageFocusStyle(focus?: Partial<ImageFocus> | null): CSSProperties {
  const { x, y } = normalizeImageFocus(focus?.x, focus?.y)
  return { objectPosition: `${x}% ${y}%` }
}
