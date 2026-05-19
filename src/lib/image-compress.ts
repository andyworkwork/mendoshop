const MAX_WIDTH = 1400
const MAX_BYTES = 500_000
const QUALITY_STEPS = [0.82, 0.72, 0.62, 0.52]

/**
 * Comprime imágenes en el navegador antes de subir (WebP, ancho máx. 1400px, ~500 KB).
 */
export async function compressImageForUpload(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) {
    throw new Error('El archivo debe ser una imagen')
  }

  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_WIDTH / bitmap.width)
  const w = Math.round(bitmap.width * scale)
  const h = Math.round(bitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('No se pudo procesar la imagen')
  ctx.drawImage(bitmap, 0, 0, w, h)
  bitmap.close()

  for (const q of QUALITY_STEPS) {
    const blob = await canvasToWebp(canvas, q)
    if (blob.size <= MAX_BYTES || q === QUALITY_STEPS[QUALITY_STEPS.length - 1]) {
      const base = file.name.replace(/\.[^.]+$/, '') || 'imagen'
      return new File([blob], `${base}.webp`, { type: 'image/webp' })
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
