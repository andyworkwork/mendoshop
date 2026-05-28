import { getPublicUrlFromPath } from '@/lib/publicUrl'

const BUCKET = 'shop-images'

/** Rutas fijas por producto (upsert = no acumular archivos viejos). */
export function productImagePaths(shopId: string, productId: string) {
  const base = `${shopId}/${productId}`
  return {
    main: `${base}/main.webp`,
    thumb: `${base}/thumb.webp`,
  }
}

export function thumbPathFromMain(mainPath: string): string {
  if (mainPath.endsWith('/main.webp')) {
    return mainPath.replace(/\/main\.webp$/, '/thumb.webp')
  }
  return mainPath
}

/**
 * URL pública de imagen de producto.
 * - thumb: miniatura en grilla (menos egress)
 * - full: imagen principal
 */
export function getProductImageUrl(
  path: string | null | undefined,
  variant: 'thumb' | 'full' = 'full',
): string | null {
  if (!path) return null

  if (variant === 'full') {
    return getPublicUrlFromPath(path)
  }

  const thumbPath = thumbPathFromMain(path)
  const thumbUrl = getPublicUrlFromPath(thumbPath)
  if (thumbUrl && thumbPath !== path) {
    return thumbUrl
  }

  return renderImageUrl(path, { width: 480, quality: 70 })
}

/** URL transformada (menos egress que servir el original en vitrina). */
export function renderStorageImageUrl(
  path: string,
  opts: { width: number; quality?: number },
): string | null {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '')
  if (!base) return getPublicUrlFromPath(path)
  const q = new URLSearchParams({
    width: String(opts.width),
    quality: String(opts.quality ?? 72),
    format: 'webp',
  })
  return `${base}/storage/v1/render/image/public/${BUCKET}/${path}?${q}`
}

function renderImageUrl(
  path: string,
  opts: { width: number; quality: number },
): string | null {
  return renderStorageImageUrl(path, opts)
}

/** Evita que el CDN/navegador muestre la versión anterior tras reemplazar en la misma ruta. */
export function withImageCacheBust(
  url: string | null,
  revision?: number | string | null,
): string | null {
  if (!url || revision == null) return url
  const sep = url.includes('?') ? '&' : '?'
  return `${url}${sep}v=${encodeURIComponent(String(revision))}`
}

/** Paths a borrar al reemplazar o eliminar producto. */
export function pathsToRemove(
  shopId: string,
  productId: string,
  currentPath: string | null,
): string[] {
  const { main, thumb } = productImagePaths(shopId, productId)
  const set = new Set<string>([main, thumb])
  if (currentPath) set.add(currentPath)
  if (currentPath?.endsWith('/main.webp')) {
    set.add(thumbPathFromMain(currentPath))
  }
  return [...set]
}
