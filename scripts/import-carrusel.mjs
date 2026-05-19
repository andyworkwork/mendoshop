import sharp from 'sharp'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const sourceDir = path.join(process.env.USERPROFILE ?? '', 'Desktop', 'carrusel')
const templatesOut = path.join(root, 'public/store-templates')
const carouselOut = path.join(root, 'public/hero-carousel')

const BANNER_W = 1080
const BANNER_H = 520
const CAROUSEL_W = 1080
const CAROUSEL_H = 1440

function toSlug(filename) {
  return filename
    .replace(/\.(jfif|jpe?g|png|webp)$/i, '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function toTitle(slug) {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

if (!fs.existsSync(sourceDir)) {
  console.error(`No se encontró la carpeta: ${sourceDir}`)
  process.exit(1)
}

fs.mkdirSync(templatesOut, { recursive: true })
fs.mkdirSync(carouselOut, { recursive: true })

const files = fs
  .readdirSync(sourceDir)
  .filter((f) => /\.(jfif|jpe?g|png|webp)$/i.test(f))
  .sort((a, b) => a.localeCompare(b, 'es'))

const manifest = []

for (const file of files) {
  const slug = toSlug(file)
  const input = path.join(sourceDir, file)
  const bannerPath = path.join(templatesOut, `${slug}.webp`)
  const slidePath = path.join(carouselOut, `${slug}.webp`)

  const base = sharp(input).rotate()

  await base
    .clone()
    .resize(BANNER_W, BANNER_H, { fit: 'cover', position: 'center' })
    .webp({ quality: 82 })
    .toFile(bannerPath)

  await base
    .clone()
    .resize(CAROUSEL_W, CAROUSEL_H, { fit: 'cover', position: 'center' })
    .modulate({ brightness: 1.08, saturation: 1.05 })
    .webp({ quality: 82 })
    .toFile(slidePath)

  manifest.push({ id: slug, name: toTitle(slug), file })
  console.log(`✓ ${file} → ${slug}`)
}

fs.writeFileSync(
  path.join(root, 'src/lib/store-templates.manifest.json'),
  JSON.stringify(manifest, null, 2),
)

console.log(`\n${manifest.length} plantillas en public/store-templates/ y public/hero-carousel/`)
