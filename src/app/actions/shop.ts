'use server'

import { createClient } from '@/lib/supabase/server'
import { slugify } from '@/lib/format'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { normalizeInstagramUrl, normalizeTikTokUrl, normalizeWebsiteUrl } from '@/lib/social-links'
import type { ShopTheme } from '@/types/shop'

export async function updateShopSettings(
  shopId: string,
  data: {
    name?: string
    description?: string | null
    whatsapp_e164?: string
    category_label?: string | null
    seo_title?: string | null
    seo_description?: string | null
    theme?: ShopTheme
    instagram_url?: string | null
    tiktok_url?: string | null
    website_url?: string | null
    social_whatsapp_visible?: boolean
  },
) {
  const supabase = await createClient()
  const patch: Record<string, unknown> = {}
  if (data.name != null) patch.name = data.name
  if (data.description !== undefined) patch.description = data.description
  if (data.whatsapp_e164 != null) patch.whatsapp_e164 = data.whatsapp_e164.replace(/\D/g, '')
  if (data.category_label !== undefined) patch.category_label = data.category_label
  if (data.seo_title !== undefined) patch.seo_title = data.seo_title
  if (data.seo_description !== undefined) patch.seo_description = data.seo_description
  if (data.theme != null) patch.theme = data.theme
  if (data.instagram_url !== undefined) {
    patch.instagram_url = data.instagram_url ? normalizeInstagramUrl(data.instagram_url) : null
  }
  if (data.tiktok_url !== undefined) {
    patch.tiktok_url = data.tiktok_url ? normalizeTikTokUrl(data.tiktok_url) : null
  }
  if (data.website_url !== undefined) {
    patch.website_url = data.website_url ? normalizeWebsiteUrl(data.website_url) : null
  }
  if (data.social_whatsapp_visible !== undefined) {
    patch.social_whatsapp_visible = data.social_whatsapp_visible
  }

  const { data: row, error } = await supabase
    .from('shops')
    .update(patch)
    .eq('id', shopId)
    .select('slug')
    .single()
  if (error) return { error: error.message }
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/settings')
  if (row?.slug) revalidatePath(`/tienda/${row.slug}`)
  return { ok: true }
}

export async function signOutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function validateSlug(slug: string): Promise<boolean> {
  const s = slugify(slug)
  if (s.length < 3) return false
  const supabase = await createClient()
  const { data } = await supabase.from('shops').select('id').eq('slug', s).maybeSingle()
  return !data
}
