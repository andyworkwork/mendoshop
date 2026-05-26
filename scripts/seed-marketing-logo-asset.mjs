/**
 * Sube el logo (public/mendoshop-logo.png) a la biblioteca de marketing.
 * Reemplaza el asset de icono si existía.
 *
 * Uso: node --env-file=.env.local scripts/seed-marketing-logo-asset.mjs
 */
import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'
import fs from 'fs'
import path from 'path'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

const TAG = 'logo-sitio'
const LEGACY_TAG = 'icono-sitio'
const TITLE = 'Logo Mendoshop'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const logoPath = path.join(root, 'public/mendoshop-logo.png')

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  if (!url || !key) {
    console.error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local')
    process.exit(1)
  }
  if (!fs.existsSync(logoPath)) {
    console.error('No se encontró:', logoPath)
    process.exit(1)
  }

  const sb = createClient(url, key, { auth: { persistSession: false } })
  const webp = await sharp(logoPath).webp({ quality: 92 }).toBuffer()

  const { data: legacyRows } = await sb
    .from('marketing_assets')
    .select('id, storage_path')
    .contains('tags', [LEGACY_TAG])

  const { data: logoRows } = await sb
    .from('marketing_assets')
    .select('id, storage_path')
    .contains('tags', [TAG])

  const existing = logoRows?.[0] ?? legacyRows?.[0]
  const assetId = existing?.id ?? randomUUID()
  const storagePath = existing?.storage_path ?? `marketing/${assetId}/image.webp`

  const { error: upErr } = await sb.storage.from('shop-images').upload(storagePath, webp, {
    contentType: 'image/webp',
    upsert: true,
  })
  if (upErr) {
    console.error('Storage:', upErr.message)
    process.exit(1)
  }

  const row = {
    title: TITLE,
    description: 'Logo oficial de Mendoshop (cabecera y marca).',
    asset_type: 'image',
    storage_path: storagePath,
    tags: [TAG, 'mendoshop', 'branding'],
  }

  if (existing) {
    const { data, error } = await sb
      .from('marketing_assets')
      .update(row)
      .eq('id', assetId)
      .select('id, title')
      .single()
    if (error) {
      console.error('DB:', error.message)
      process.exit(1)
    }
    console.log('Asset actualizado en biblioteca:', data.title, data.id)
    return
  }

  const { data, error } = await sb
    .from('marketing_assets')
    .insert({ id: assetId, ...row })
    .select('id, title')
    .single()

  if (error) {
    console.error('DB:', error.message)
    process.exit(1)
  }

  console.log('Asset creado en biblioteca:', data.title, data.id)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
