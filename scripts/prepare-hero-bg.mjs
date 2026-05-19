import sharp from 'sharp'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const sourceDesktop = path.join(root, 'assets/boceto-hero.png')
const sourceMobile = path.join(root, 'assets/boceto-hero-mobile.png')
const logoPath = path.join(root, 'public/mendoshop-logo.png')
const outputDesktop = path.join(root, 'public/mendoshop-hero-bg.png')
const outputMobile = path.join(root, 'public/mendoshop-hero-bg-mobile.png')

/** Desktop: ancho retina con cover horizontal. */
const DESKTOP_WIDTH = 2048

/** Móvil: retrato 9:16 (boceto vertical dedicado). */
const MOBILE_WIDTH = 1080
const MOBILE_HEIGHT = 1920

async function roundedLogo(input, size, radius) {
  const mask = Buffer.from(
    `<svg width="${size}" height="${size}">
      <rect width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="#fff"/>
    </svg>`,
  )

  return sharp(input)
    .resize(size, size, { fit: 'cover' })
    .composite([{ input: mask, blend: 'dest-in' }])
    .png()
    .toBuffer()
}

async function compositeLogoBottomRight(imageWidth, imageHeight, pipeline) {
  const logoSize = Math.max(56, Math.round(imageWidth * 0.11))
  const radius = Math.round(logoSize * 0.24)
  const padding = Math.max(12, Math.round(imageWidth * 0.028))
  const logo = await roundedLogo(logoPath, logoSize, radius)
  const left = imageWidth - logoSize - padding
  const top = imageHeight - logoSize - padding

  return pipeline.composite([{ input: logo, left, top }])
}

// --- Desktop ---
const desktopMeta = await sharp(sourceDesktop).metadata()
const srcW = desktopMeta.width ?? 1024
const srcH = desktopMeta.height ?? 682
const desktopW = DESKTOP_WIDTH
const desktopH = Math.round(srcH * (DESKTOP_WIDTH / srcW))

const desktopOut = await compositeLogoBottomRight(
  desktopW,
  desktopH,
  sharp(sourceDesktop).resize(desktopW, desktopH, {
    fit: 'fill',
    kernel: sharp.kernel.lanczos3,
  }),
)
await desktopOut.png({ compressionLevel: 8 }).toFile(outputDesktop)

// --- Móvil (artwork vertical + logo Mendoshop abajo a la derecha) ---
const mobileMeta = await sharp(sourceMobile).metadata()
const mobileSrcW = mobileMeta.width ?? 687
const mobileSrcH = mobileMeta.height ?? 1024

const mobileOut = await compositeLogoBottomRight(
  MOBILE_WIDTH,
  MOBILE_HEIGHT,
  sharp(sourceMobile)
    .resize(MOBILE_WIDTH, MOBILE_HEIGHT, {
      fit: 'cover',
      position: 'center',
      kernel: sharp.kernel.lanczos3,
    })
    .modulate({ brightness: 1.14, saturation: 1.06 }),
)
await mobileOut.png({ compressionLevel: 8 }).toFile(outputMobile)

const desktopLogoSize = Math.max(56, Math.round(desktopW * 0.075))
const mobileLogoSize = Math.max(56, Math.round(MOBILE_WIDTH * 0.11))

console.log(`Hero desktop: ${outputDesktop} (${desktopW}x${desktopH}, logo ${desktopLogoSize}px)`)
console.log(
  `Hero mobile:  ${outputMobile} (${MOBILE_WIDTH}x${MOBILE_HEIGHT} from ${mobileSrcW}x${mobileSrcH}, logo ${mobileLogoSize}px)`,
)
