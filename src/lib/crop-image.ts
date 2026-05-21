import { clampFocusPercent, type ImageFocus } from '@/lib/image-focus'

/** Dimensiones de salida al recortar (misma proporción que la vitrina). */
export const CROP_OUTPUT = {
  product: { main: { w: 1200, h: 960 }, thumb: { w: 480, h: 384 }, aspect: [5, 4] as const },
  banner: { w: 1400, h: 700, aspect: [2, 1] as const },
} as const

export function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('No se pudo cargar la imagen'))
    img.src = src
  })
}

/** Dibuja recorte tipo object-cover según el punto de enfoque. */
export function drawCoverCrop(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  destW: number,
  destH: number,
  focus: ImageFocus,
) {
  const iw = img.naturalWidth
  const ih = img.naturalHeight
  if (iw <= 0 || ih <= 0) return

  const scale = Math.max(destW / iw, destH / ih)
  const sw = iw * scale
  const sh = ih * scale
  const fx = clampFocusPercent(focus.x) / 100
  const fy = clampFocusPercent(focus.y) / 100
  const dx = (destW - sw) * fx
  const dy = (destH - sh) * fy
  ctx.drawImage(img, dx, dy, sw, sh)
}

export async function cropImageToBlob(
  src: string,
  focus: ImageFocus,
  width: number,
  height: number,
  quality = 0.82,
): Promise<Blob> {
  const img = await loadImageElement(src)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('No se pudo preparar el recorte')

  drawCoverCrop(ctx, img, width, height, focus)

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('No se pudo exportar WebP'))),
      'image/webp',
      quality,
    )
  })
}
