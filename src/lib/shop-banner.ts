import { getPublicUrlFromPath } from '@/lib/publicUrl'
import { renderStorageImageUrl } from '@/lib/product-images'

/** Ruta fija del banner de tienda en Storage (upsert, WebP). */
export function shopBannerStoragePath(shopId: string): string {
  return `${shopId}/banner.webp`
}

/** Banner en vitrina: versión más liviana vía transform (menos egress). */
export function getShopBannerDisplayUrl(bannerPath: string | null | undefined): string | null {
  if (!bannerPath) return null
  return renderStorageImageUrl(bannerPath, { width: 960, quality: 72 }) ?? getPublicUrlFromPath(bannerPath)
}

