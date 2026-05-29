/**
 * Cache-Control (segundos) en subidas a `shop-images`.
 * Misma ruta con upsert: no subir demasiado o el CDN sirve la versión anterior.
 */
/** 1 h: upsert en la misma ruta; vitrina usa ?v=updated_at para invalidar CDN. */
export const SHOP_IMAGES_CACHE_CONTROL = '3600'
