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
const templatesOut = path.join(root, 'public/store-templates')
const carouselOut = path.join(root, 'public', CAROUSEL_DIR_NAME)

const BANNER_W = 1080
const BANNER_H = 520

function toTitle(slug) {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

if (!fs.existsSync(CARRUSEL_DESKTOP_DIR)) {
  console.error(`No se encontró la carpeta: ${CARRUSEL_DESKTOP_DIR}`)
  process.exit(1)
}

fs.mkdirSync(templatesOut, { recursive: true })
fs.mkdirSync(carouselOut, { recursive: true })

const sources = listCarruselWebpOneVariants(CARRUSEL_DESKTOP_DIR)

if (sources.length === 0) {
  console.error(`No hay .webp con "(1)" en ${CARRUSEL_DESKTOP_DIR}`)
  process.exit(1)
}

const manifest = []

for (const { file, slug, input } of sources) {
  const bannerPath = path.join(templatesOut, `${slug}.webp`)
  const slidePath = path.join(carouselOut, `${slug}.webp`)

  const base = sharp(input).rotate()

  await base
    .clone()
    .resize(BANNER_W, BANNER_H, { fit: 'cover', position: 'center' })
    .webp({ quality: 82 })
    .toFile(bannerPath)

  const carouselOpts = carouselResizeForSlug(slug)
  let slide = base.clone().resize(CAROUSEL_W, CAROUSEL_H, carouselOpts)
  if (carouselOpts.fit === 'cover') {
    slide = slide.modulate({ brightness: 1.08, saturation: 1.05 })
  }
  await slide.webp({ quality: CAROUSEL_WEBP_QUALITY, effort: 6 }).toFile(slidePath)

  manifest.push({ id: slug, name: toTitle(slug), file })
  console.log(`✓ ${file} → ${slug}`)
}

fs.writeFileSync(
  path.join(root, 'src/lib/store-templates.manifest.json'),
  JSON.stringify(manifest, null, 2),
)

console.log(
  `\n${manifest.length} plantillas desde * (1).webp → store-templates/ y ${CAROUSEL_DIR_NAME}/`,
)
