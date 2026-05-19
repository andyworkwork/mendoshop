import sharp from 'sharp'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const source = path.join(root, 'public/mendoshop-logo.png')

async function roundedPng(input, output, size, radius) {
  const mask = Buffer.from(
    `<svg width="${size}" height="${size}">
      <rect width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="#fff"/>
    </svg>`,
  )

  await sharp(input)
    .resize(size, size, { fit: 'cover' })
    .composite([{ input: mask, blend: 'dest-in' }])
    .png()
    .toFile(output)

  console.log(`Wrote ${output} (${size}x${size}, r=${radius})`)
}

await roundedPng(source, path.join(root, 'src/app/icon.png'), 32, 11)
await roundedPng(source, path.join(root, 'src/app/apple-icon.png'), 180, 48)
