'use server'

import { clampFocusPercent } from '@/lib/image-focus'
import { createClient } from '@/lib/supabase/server'
import { consumeRateLimit } from '@/lib/rate-limit'
import { slugify } from '@/lib/format'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import {
  SANITIZE_LIMITS,
  sanitizeMultilineTextOrNull,
  sanitizePlainText,
  sanitizePlainTextOrNull,
  sanitizeWhatsAppDigits,
} from '@/lib/sanitize'
import { normalizeInstagramUrl, normalizeTikTokUrl, normalizeWebsiteUrl } from '@/lib/social-links'
import { normalizeCategoryIcon } from '@/lib/category-icons'
import { maxFeaturedProductsForPlan } from '@/lib/featured-products'
import type { ShopPlan, ShopTheme } from '@/types/shop'

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
    banner_path?: string | null
    banner_focus_x?: number
    banner_focus_y?: number
    banner_show_shop_name?: boolean
    featured_product_ids?: string[]
    category_view_icon?: string
  },
) {
  const supabase = await createClient()
  const patch: Record<string, unknown> = {}
  if (data.name != null) {
    const name = sanitizePlainText(data.name, SANITIZE_LIMITS.shopName)
    if (!name) return { error: 'El nombre de la tienda no es válido.' }
    patch.name = name
  }
  if (data.description !== undefined) {
    patch.description = sanitizeMultilineTextOrNull(data.description, SANITIZE_LIMITS.shopDescription)
  }
  if (data.whatsapp_e164 != null) patch.whatsapp_e164 = sanitizeWhatsAppDigits(data.whatsapp_e164)
  if (data.category_label !== undefined) {
    patch.category_label = sanitizePlainTextOrNull(data.category_label, SANITIZE_LIMITS.categoryLabel)
  }
  if (data.seo_title !== undefined) {
    patch.seo_title = sanitizePlainTextOrNull(data.seo_title, SANITIZE_LIMITS.seoTitle)
  }
  if (data.seo_description !== undefined) {
    patch.seo_description = sanitizeMultilineTextOrNull(
      data.seo_description,
      SANITIZE_LIMITS.seoDescription,
    )
  }
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
  if (data.banner_path !== undefined) patch.banner_path = data.banner_path
  if (data.banner_focus_x !== undefined) patch.banner_focus_x = clampFocusPercent(data.banner_focus_x)
  if (data.banner_focus_y !== undefined) patch.banner_focus_y = clampFocusPercent(data.banner_focus_y)
  if (data.banner_show_shop_name !== undefined) {
    patch.banner_show_shop_name = data.banner_show_shop_name
  }
  if (data.featured_product_ids !== undefined) {
    const { data: planRow, error: planErr } = await supabase
      .from('shops')
      .select('plan')
      .eq('id', shopId)
      .single()
    if (planErr) return { error: planErr.message }
    const planMax = maxFeaturedProductsForPlan((planRow?.plan as ShopPlan) ?? 'free_trial')
    const ids = [...new Set(data.featured_product_ids)].slice(0, planMax)
    if (ids.length > 0) {
      const { data: owned, error: ownErr } = await supabase
        .from('products')
        .select('id')
        .eq('shop_id', shopId)
        .eq('active', true)
        .in('id', ids)
      if (ownErr) return { error: ownErr.message }
      const ownedSet = new Set((owned ?? []).map((r) => r.id as string))
      patch.featured_product_ids = ids.filter((id) => ownedSet.has(id))
    } else {
      patch.featured_product_ids = []
    }
  }
  if (data.category_view_icon !== undefined) {
    patch.category_view_icon = normalizeCategoryIcon(data.category_view_icon)
  }

  const { data: row, error } = await supabase
    .from('shops')
    .update(patch)
    .eq('id', shopId)
    .select('slug')
    .single()
  if (error) return { error: error.message }
  revalidatePath('/')
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/settings')
  revalidatePath('/dashboard/editar-tienda')
  if (row?.slug) revalidatePath(`/tienda/${row.slug}`)
  return { ok: true }
}

/** Invalida caché de la tienda pública tras cambios en el catálogo. */
export async function revalidateStorefront(slug: string) {
  revalidatePath(`/tienda/${slug}`)
}

export async function signOutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}

/** Solo usuarios autenticados; respuesta opaca (no distingue “ocupado” de “formato inválido”). */
export async function validateSlug(slug: string): Promise<{ acceptable: boolean }> {
  const s = slugify(slug)
  if (s.length < 3 || s.length > 60) return { acceptable: false }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { acceptable: false }

  const allowed = await consumeRateLimit(`slug-check:${user.id}`, 30, 60)
  if (!allowed) return { acceptable: false }

  const { data } = await supabase.from('shops').select('id').eq('slug', s).maybeSingle()
  return { acceptable: !data }
}
