import { appBaseUrl, getPublicUrlFromPath } from '@/lib/publicUrl'
import { renderStorageImageUrl } from '@/lib/product-images'
import { templateBannerSrc } from '@/lib/store-templates'
import type { ShopRow } from '@/types/shop'

/** Ruta fija del banner de tienda en Storage (upsert, WebP). */
export function shopBannerStoragePath(shopId: string): string {
  return `${shopId}/banner.webp`
}

/** Banner en vitrina: versión más liviana vía transform (menos egress). */
export function getShopBannerDisplayUrl(bannerPath: string | null | undefined): string | null {
  if (!bannerPath) return null
  return renderStorageImageUrl(bannerPath, { width: 960, quality: 72 }) ?? getPublicUrlFromPath(bannerPath)
}

/**
 * URL original para recortar (archivo completo en Storage o plantilla a resolución completa).
 * No usar la URL transformada de vitrina: provoca recortes incorrectos y caché vieja.
 */
export function resolveShopBannerCropSourceUrl(
  shop: Pick<ShopRow, 'banner_path' | 'theme'>,
  cacheBust?: number | string,
): string | null {
  let url: string | null = null

  if (shop.banner_path) {
    url = getPublicUrlFromPath(shop.banner_path)
  } else {
    const tpl = templateBannerSrc(shop.theme.templateId)
    if (!tpl) return null
    url = tpl.startsWith('/') ? `${appBaseUrl()}${tpl}` : tpl
  }

  if (!url) return null
  if (cacheBust == null) return url

  const sep = url.includes('?') ? '&' : '?'
  return `${url}${sep}v=${cacheBust}`
}
