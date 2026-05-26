'use server'

import { slugify } from '@/lib/format'
import {
  SANITIZE_LIMITS,
  sanitizePlainText,
  sanitizePlainTextOrNull,
  sanitizeWhatsAppDigits,
} from '@/lib/sanitize'
import { SHOP_SLUG_TAKEN_MESSAGE } from '@/lib/shop-slug'
import { pendingShopToUserMetadata, type PendingShopRegistration } from '@/lib/pending-registration'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { fetchUserShops } from '@/lib/shops'
import { revalidatePath } from 'next/cache'

export type RegisterActionResult =
  | { ok: true; shopName: string; shopSlug: string }
  | { error: string }

/** Comprueba si el slug de tienda está libre (público, para el formulario de registro). */
export async function checkShopSlugAvailable(
  slug: string,
): Promise<{ available: boolean } | { error: string }> {
  const cleanSlug = slugify(slug)
  if (cleanSlug.length < 3) {
    return { available: false }
  }

  try {
    const service = createServiceClient()
    const { data, error } = await service.from('shops').select('id').eq('slug', cleanSlug).maybeSingle()
    if (error) return { error: error.message }
    return { available: !data }
  } catch {
    return { error: 'No se pudo verificar el link. Intentá de nuevo.' }
  }
}

export async function completeShopRegistration(
  input: PendingShopRegistration,
): Promise<RegisterActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Tenés que iniciar sesión o confirmar tu email antes de crear la tienda.' }
  }

  const existing = await fetchUserShops(supabase)
  if (existing.length > 0) {
    return { error: 'Ya tenés una tienda en esta cuenta. Entrá al panel.' }
  }

  const cleanSlug = slugify(input.slug)
  const shopName = sanitizePlainText(input.shopName, SANITIZE_LIMITS.shopName)
  const wa = sanitizeWhatsAppDigits(input.whatsapp)
  const rubro = sanitizePlainTextOrNull(input.rubro, SANITIZE_LIMITS.categoryLabel)

  if (cleanSlug.length < 3) {
    return { error: 'El link de tu tienda debe tener al menos 3 caracteres.' }
  }
  if (wa.length < 10) {
    return { error: 'Ingresá un WhatsApp válido (código de área + número).' }
  }
  if (!shopName) {
    return { error: 'Ingresá el nombre de tu negocio.' }
  }

  const trialEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  const ref = input.referralSlug?.trim() ? slugify(input.referralSlug.trim()) : null

  const slugCheck = await checkShopSlugAvailable(cleanSlug)
  if ('error' in slugCheck) return { error: slugCheck.error }
  if (!slugCheck.available) return { error: SHOP_SLUG_TAKEN_MESSAGE }

  const { data: shop, error: shopErr } = await supabase
    .from('shops')
    .insert({
      slug: cleanSlug,
      name: shopName,
      description: null,
      whatsapp_e164: wa,
      category_label: rubro,
      plan: 'free_trial',
      plan_until: trialEnd,
      active: true,
      referred_by_slug: ref && ref.length >= 3 ? ref : null,
    })
    .select('id')
    .single()

  if (shopErr) {
    if (shopErr.message.includes('unique') || shopErr.code === '23505') {
      return { error: SHOP_SLUG_TAKEN_MESSAGE }
    }
    return { error: shopErr.message }
  }

  const { error: memberErr } = await supabase.from('shop_members').insert({
    shop_id: shop.id,
    user_id: user.id,
    role: 'owner',
  })

  if (memberErr) {
    try {
      const service = createServiceClient()
      await service.from('shops').delete().eq('id', shop.id)
    } catch {
      /* sin service role no se puede limpiar; el usuario puede reintentar con otro link */
    }
    return { error: memberErr.message }
  }

  await supabase.auth.updateUser({
    data: {
      pending_shop_name: null,
      pending_shop_slug: null,
      pending_whatsapp: null,
      pending_rubro: null,
      pending_ref: null,
    },
  })

  revalidatePath('/dashboard')
  revalidatePath('/registro')
  revalidatePath('/registro/completar')
  return { ok: true, shopName, shopSlug: cleanSlug }
}
