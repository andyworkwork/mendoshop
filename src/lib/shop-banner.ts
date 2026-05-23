import { getPublicUrlFromPath } from '@/lib/publicUrl'
import { renderStorageImageUrl } from '@/lib/product-images'

/** Nueva subida: ruta única para evitar caché CDN en la misma URL. */
export function shopBannerStoragePath(shopId: string, revision?: string): string {
  if (revision) return `${shopId}/banner-${revision}.webp`
  return `${shopId}/banner.webp`
}

export function newShopBannerRevision(): string {
  return Date.now().toString(36)
}

/** Banner en vitrina: versión más liviana vía transform (menos egress). */
export function getShopBannerDisplayUrl(
  bannerPath: string | null | undefined,
  opts?: { cacheKey?: string | null },
): string | null {
  if (!bannerPath) return null
  const base =
    renderStorageImageUrl(bannerPath, { width: 960, quality: 72 }) ?? getPublicUrlFromPath(bannerPath)
  if (!base || !opts?.cacheKey) return base
  const sep = base.includes('?') ? '&' : '?'
  return `${base}${sep}v=${encodeURIComponent(opts.cacheKey)}`
}

