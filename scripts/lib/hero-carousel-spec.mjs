import fs from 'fs'
import path from 'path'

/**
 * Tamaño estándar del carrusel móvil (home, login, etc.).
 * Fuente: Desktop/carrusel/* (1).webp → npm run carousel:normalize && carousel:sync-slides
 */
export const CAROUSEL_W = 1536
export const CAROUSEL_H = 2048
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

/** Variantes (1): .webp cuyo nombre incluye "(1)" — fuente del carrusel home. */
export function isCarouselOneVariant(filename) {
  return /\.webp$/i.test(filename) && filename.includes('(1)')
}

export function listCarruselWebpOneVariants(dir = CARRUSEL_DESKTOP_DIR) {
  return listCarruselWebp(dir)
    .filter((e) => isCarouselOneVariant(e.file))
    .sort((a, b) => a.file.localeCompare(b.file, 'es'))
}

export function carouselSlideAlt(file) {
  const label = file.replace(/\s*\(1\)\.webp$/i, '').trim()
  return `Mendoshop — ${label.charAt(0).toUpperCase()}${label.slice(1)}`
}
