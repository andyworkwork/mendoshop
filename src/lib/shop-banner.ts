/** Ruta fija del banner de tienda en Storage (upsert, WebP). */
export function shopBannerStoragePath(shopId: string): string {
  return `${shopId}/banner.webp`
}
