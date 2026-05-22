/**
 * Sincroniza plantillas y carrusel solo desde Desktop/carrusel/* (1).webp
 * Extrae colores sugeridos por imagen y genera store-templates.generated.ts
 *
 * Uso: npm run templates:sync
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
  carouselSlideAlt,
  listCarruselWebpOneVariants,
} from './lib/hero-carousel-spec.mjs'
import { extractThemeFromImage } from './lib/extract-theme-from-image.mjs'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const templatesOut = path.join(root, 'public/store-templates')
const carouselOut = path.join(root, 'public', CAROUSEL_DIR_NAME)
const BANNER_W = 1080
const BANNER_H = 520

/** Ajustes manuales cuando la foto lo pide (4 colores de vitrina + fondo). */
const THEME_OVERRIDES = {
  'deportivos-1': {
    primary: '#8B5E3C',
    accent: '#1e4d6b',
    productFrame: '#ffffff',
    titleColor: '#3d2e24',
    background: 'light',
    backgroundColors: { light: '#f8f6f3' },
  },
  'manicura-1': {
    primary: '#c9a227',
    accent: '#a67c52',
    productFrame: '#f5ebe0',
    titleColor: '#5c4838',
    background: 'gradient',
    backgroundColors: { gradientTop: '#e8c89a', gradientBottom: '#1a1410' },
  },
  'bijuteria-1': {
    primary: '#9a7b2e',
    accent: '#6b4c9a',
    productFrame: '#faf8f5',
    titleColor: '#4a3d2a',
    background: 'light',
    backgroundColors: { light: '#f0ebe3' },
  },
  'ropa-1': {
    primary: '#c41e5a',
    accent: '#1a1a1a',
    productFrame: '#f8f8f8',
    titleColor: '#2d2d2d',
    background: 'light',
    backgroundColors: { light: '#f2f2f2' },
  },
}

const DESCRIPTIONS = {
  'accesorios-de-celular': 'Fundas, cables y más',
  'alimento-de-mascota': 'Alimentos y snacks',
  bijuteria: 'Joyas y accesorios',
  deportivos: 'Artículos deportivos',
  'flores-de-limpiapipas': 'Artesanías y manualidades',
  manicura: 'Belleza y uñas',
  plantas: 'Verde y naturaleza',
  ropa: 'Indumentaria y moda',
}

function rubroName(file) {
  return file.replace(/\s*\(1\)\.webp$/i, '').trim()
}

function descriptionForSlug(slug) {
  const base = slug.replace(/-1$/, '')
  return DESCRIPTIONS[base] ?? 'Tu tienda online'
}

function cleanDir(dir, keepSlugs) {
  if (!fs.existsSync(dir)) return
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith('.webp')) continue
    const slug = f.replace(/\.webp$/i, '')
    if (!keepSlugs.has(slug)) {
      fs.unlinkSync(path.join(dir, f))
      console.log(`  − eliminado ${path.relative(root, path.join(dir, f))}`)
    }
  }
}

const entries = listCarruselWebpOneVariants(CARRUSEL_DESKTOP_DIR)
if (entries.length === 0) {
  console.error(`No hay .webp con "(1)" en ${CARRUSEL_DESKTOP_DIR}`)
  process.exit(1)
}

fs.mkdirSync(templatesOut, { recursive: true })
fs.mkdirSync(carouselOut, { recursive: true })

const keepSlugs = new Set(entries.map((e) => e.slug))
const templates = []

for (const { file, slug, input } of entries) {
  const bannerPath = path.join(templatesOut, `${slug}.webp`)
  const slidePath = path.join(carouselOut, `${slug}.webp`)
  const base = sharp(input).rotate()
  const carouselOpts = carouselResizeForSlug(slug)

  await base
    .clone()
    .resize(BANNER_W, BANNER_H, { fit: 'cover', position: 'center' })
    .webp({ quality: 82 })
    .toFile(bannerPath)

  let slide = base.clone().resize(CAROUSEL_W, CAROUSEL_H, { ...carouselOpts, kernel: sharp.kernel.lanczos3 })
  if (carouselOpts.fit === 'cover') {
    slide = slide.modulate({ brightness: 1.08, saturation: 1.05 })
  }
  await slide.webp({ quality: CAROUSEL_WEBP_QUALITY, effort: 6 }).toFile(slidePath)

  const extracted = await extractThemeFromImage(input)
  const override = THEME_OVERRIDES[slug] ?? {}
  const name = rubroName(file)
  const templateId = slug.replace(/-1$/, '') || slug

  const defaults = {
    templateId,
    primary: override.primary ?? extracted.primary,
    accent: override.accent ?? extracted.accent,
    productFrame: override.productFrame ?? extracted.productFrame,
    titleColor: override.titleColor ?? extracted.titleColor,
    background: override.background ?? extracted.background,
    backgroundColors: {
      ...extracted.backgroundColors,
      ...(override.backgroundColors ?? {}),
    },
  }

  templates.push({
    id: templateId,
    name: name.charAt(0).toUpperCase() + name.slice(1),
    description: descriptionForSlug(slug),
    bannerSrc: `/store-templates/${slug}.webp`,
    carouselSrc: `/${CAROUSEL_DIR_NAME}/${slug}.webp`,
    defaults,
  })

  console.log(
    `✓ ${file} → ${slug} (${defaults.background}, ${defaults.primary}, detalle ${defaults.accent}, título ${defaults.titleColor})`,
  )
}

console.log('\nLimpiando archivos viejos…')
cleanDir(templatesOut, keepSlugs)
cleanDir(carouselOut, keepSlugs)

const slides = entries.map(({ file, slug }) => ({
  src: `/${CAROUSEL_DIR_NAME}/${slug}.webp`,
  alt: carouselSlideAlt(file),
}))

const rubroOptions = templates.map((t) => t.name)

const templatesTs = `/** Generado por npm run templates:sync — no editar a mano. */
import type { ShopTheme } from '@/types/shop'

export type StoreTemplate = {
  id: string
  name: string
  description: string
  bannerSrc: string
  carouselSrc: string
  defaults: ShopTheme
}

export const STORE_TEMPLATES: StoreTemplate[] = ${JSON.stringify(templates, null, 2)}

export const RUBRO_PRESET_OPTIONS = ${JSON.stringify(rubroOptions, null, 2)} as const
`

fs.writeFileSync(path.join(root, 'src/lib/store-templates.generated.ts'), templatesTs)

const slidesTs = `/** Generado por npm run templates:sync — no editar a mano. */
export const HERO_CAROUSEL_SLIDES: { src: string; alt: string }[] = ${JSON.stringify(slides, null, 2)}
`
fs.writeFileSync(path.join(root, 'src/lib/hero-carousel-slides.generated.ts'), slidesTs)

console.log(
  `\n${templates.length} plantillas + carrusel → public/ y src/lib/store-templates.generated.ts`,
)
