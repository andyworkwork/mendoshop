/**
 * Regenera un slide desde Desktop/carrusel/<slug>.webp
 * Uso: npm run carousel:slide -- bijuteria
 */
import sharp from 'sharp'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import {
  CAROUSEL_W,
  CAROUSEL_H,
  CAROUSEL_DIR_NAME,
  CAROUSEL_WEBP_QUALITY,
  CARRUSEL_DESKTOP_DIR,
  carouselResizeForSlug,
  listCarruselWebp,
} from './lib/hero-carousel-spec.mjs'

const slug = process.argv[2]
if (!slug) {
  console.error('Uso: npm run carousel:slide -- <slug>')
  process.exit(1)
}

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const carouselOut = path.join(root, 'public', CAROUSEL_DIR_NAME)

const entry = listCarruselWebp(CARRUSEL_DESKTOP_DIR).find((s) => s.slug === slug)

if (!entry) {
  console.error(`No hay ${slug}.webp en ${CARRUSEL_DESKTOP_DIR}`)
  process.exit(1)
}

const { input } = entry
const output = path.join(carouselOut, `${slug}.webp`)
const opts = carouselResizeForSlug(slug)

let pipeline = sharp(input).rotate().resize(CAROUSEL_W, CAROUSEL_H, opts)
if (opts.fit === 'cover') {
  pipeline = pipeline.modulate({ brightness: 1.08, saturation: 1.05 })
}
await pipeline.webp({ quality: CAROUSEL_WEBP_QUALITY, effort: 6 }).toFile(output)

const meta = await sharp(output).metadata()
console.log(`✓ ${slug}.webp ← ${path.basename(input)} → ${meta.width}×${meta.height} (${opts.fit})`)
