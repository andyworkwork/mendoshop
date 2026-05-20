import fs from 'fs'
import path from 'path'

/**
 * Tamaño del carrusel móvil (80% de 1536×2048 → menos recorte al mostrar con cover).
 * Fuente: Desktop/carrusel/*.webp → npm run carousel:normalize
 */
export const CAROUSEL_W = 1229
export const CAROUSEL_H = 1638
export const CAROUSEL_DIR_NAME = 'hero-carousel-2x'
export const CAROUSEL_WEBP_QUALITY = 88

export const CARRUSEL_DESKTOP_DIR = path.join(process.env.USERPROFILE ?? '', 'Desktop', 'carrusel')

/** Por slide: opciones sharp distintas a cover (vacío = todas iguales). */
export const CAROUSEL_OVERRIDES = {}

export function defaultCarouselResize() {
  return { fit: 'cover', position: 'center' }
}

export function carouselResizeForSlug(slug) {
  return CAROUSEL_OVERRIDES[slug] ?? defaultCarouselResize()
}

export function toSlug(filename) {
  return filename
    .replace(/\.(jfif|jpe?g|png|webp)$/i, '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/** Solo archivos .webp en Desktop/carrusel. */
export function listCarruselWebp(dir = CARRUSEL_DESKTOP_DIR) {
  if (!fs.existsSync(dir)) return []
  return fs
    .readdirSync(dir)
    .filter((f) => /\.webp$/i.test(f))
    .map((f) => ({ file: f, slug: toSlug(f), input: path.join(dir, f) }))
}
