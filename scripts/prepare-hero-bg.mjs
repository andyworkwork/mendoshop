import sharp from 'sharp'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const source = path.join(root, 'assets/boceto-hero.png')
const logoPath = path.join(root, 'public/mendoshop-logo.png')
const output = path.join(root, 'public/mendoshop-hero-bg.png')

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

const meta = await sharp(source).metadata()
const w = meta.width ?? 1024
const h = meta.height ?? 1024

const logoSize = Math.max(56, Math.round(w * 0.075))
const radius = Math.round(logoSize * 0.24)
const padding = Math.max(12, Math.round(w * 0.018))

const logo = await roundedLogo(logoPath, logoSize, radius)
const left = w - logoSize - padding
const top = h - logoSize - padding

await sharp(source)
  .composite([{ input: logo, left, top }])
  .png({ compressionLevel: 8 })
  .toFile(output)

console.log(`Hero background saved: ${output} (${w}x${h}, logo ${logoSize}px)`)
