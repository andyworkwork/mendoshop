/**
 * Genera src/lib/hero-carousel-slides.generated.ts desde Desktop/carrusel/* (1).webp
 * Uso: npm run carousel:sync-slides
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import {
  CAROUSEL_DIR_NAME,
  CARRUSEL_DESKTOP_DIR,
  carouselSlideAlt,
  listCarruselWebpOneVariants,
} from './lib/hero-carousel-spec.mjs'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const outFile = path.join(root, 'src', 'lib', 'hero-carousel-slides.generated.ts')

const entries = listCarruselWebpOneVariants(CARRUSEL_DESKTOP_DIR)

if (entries.length === 0) {
  console.error(`No hay .webp con "(1)" en ${CARRUSEL_DESKTOP_DIR}`)
  process.exit(1)
}

const slides = entries.map(({ file, slug }) => ({
  src: `/${CAROUSEL_DIR_NAME}/${slug}.webp`,
  alt: carouselSlideAlt(file),
}))

const body = `/** Generado por npm run carousel:sync-slides — no editar a mano. */
export const HERO_CAROUSEL_SLIDES: { src: string; alt: string }[] = ${JSON.stringify(slides, null, 2)}
`

fs.writeFileSync(outFile, body, 'utf8')
console.log(`✓ ${entries.length} slides → ${path.relative(root, outFile)}`)
