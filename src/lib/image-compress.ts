export type ImageUploadVariant = 'main' | 'thumb' | 'banner'

const PRESETS: Record<
  ImageUploadVariant,
  { maxWidth: number; maxBytes: number; qualities: number[] }
> = {
  main: {
    maxWidth: 1200,
    maxBytes: 380_000,
    qualities: [0.78, 0.68, 0.58, 0.48],
  },
  thumb: {
    maxWidth: 480,
    maxBytes: 90_000,
    qualities: [0.72, 0.62, 0.52],
  },
  banner: {
    maxWidth: 1400,
    maxBytes: 400_000,
    qualities: [0.78, 0.68, 0.58, 0.48],
  },
}

/**
 * Comprime imágenes en el navegador antes de subir (WebP).
 * - main: catálogo completo (~380 KB, 1200px)
 * - thumb: grilla de la tienda (~90 KB, 480px)
 * - banner: portada de la tienda (~400 KB, 1400px)
 */
export async function compressImageForUpload(
  file: File,
  variant: ImageUploadVariant = 'main',
): Promise<File> {
  if (!file.type.startsWith('image/')) {
    throw new Error('El archivo debe ser una imagen')
  }

  const { maxWidth, maxBytes, qualities } = PRESETS[variant]

  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxWidth / bitmap.width)
  const w = Math.max(1, Math.round(bitmap.width * scale))
  const h = Math.max(1, Math.round(bitmap.height * scale))

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('No se pudo procesar la imagen')
  ctx.drawImage(bitmap, 0, 0, w, h)
  bitmap.close()

  const suffix = variant === 'thumb' ? '-thumb' : variant === 'banner' ? '-banner' : ''
  for (const q of qualities) {
    const blob = await canvasToWebp(canvas, q)
    if (blob.size <= maxBytes || q === qualities[qualities.length - 1]) {
      const base = file.name.replace(/\.[^.]+$/, '') || 'imagen'
      return new File([blob], `${base}${suffix}.webp`, { type: 'image/webp' })
    }
  }

  throw new Error('No se pudo comprimir la imagen')
}

function canvasToWebp(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Compresión fallida'))),
      'image/webp',
      quality,
    )
  })
}
