/**
 * Carrusel desde Desktop/carrusel/*.webp → public/hero-carousel-2x/
 * Uso: npm run carousel:normalize
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
  listCarruselWebpOneVariants,
} from './lib/hero-carousel-spec.mjs'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const carouselDir = path.join(root, 'public', CAROUSEL_DIR_NAME)

fs.mkdirSync(carouselDir, { recursive: true })

const sources = listCarruselWebpOneVariants(CARRUSEL_DESKTOP_DIR)

if (sources.length === 0) {
  console.error(`No hay .webp con "(1)" en el nombre en ${CARRUSEL_DESKTOP_DIR}`)
  process.exit(1)
}

for (const { slug, input } of sources) {
  const output = path.join(carouselDir, `${slug}.webp`)
  const opts = carouselResizeForSlug(slug)
  let pipeline = sharp(input).rotate().resize(CAROUSEL_W, CAROUSEL_H, {
    ...opts,
    kernel: sharp.kernel.lanczos3,
  })
  if (opts.fit === 'cover') {
    pipeline = pipeline.modulate({ brightness: 1.08, saturation: 1.05 })
  }
  const buf = await pipeline.webp({ quality: CAROUSEL_WEBP_QUALITY, effort: 6 }).toBuffer()
  fs.writeFileSync(output, buf)
  const meta = await sharp(output).metadata()
  console.log(`✓ ${slug}.webp ← ${path.basename(input)} → ${meta.width}×${meta.height} (${opts.fit})`)
}

console.log(`\n${sources.length} slides → public/${CAROUSEL_DIR_NAME}/ (${CAROUSEL_W}×${CAROUSEL_H})`)
