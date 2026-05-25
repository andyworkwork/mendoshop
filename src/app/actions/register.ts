'use server'

import { slugify } from '@/lib/format'
import { pendingShopToUserMetadata, type PendingShopRegistration } from '@/lib/pending-registration'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { fetchUserShops } from '@/lib/shops'
import { revalidatePath } from 'next/cache'

export type RegisterActionResult =
  | { ok: true; shopName: string; shopSlug: string }
  | { error: string }

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
  const wa = input.whatsapp.replace(/\D/g, '')

  if (cleanSlug.length < 3) {
    return { error: 'El link de tu tienda debe tener al menos 3 caracteres.' }
  }
  if (wa.length < 10) {
    return { error: 'Ingresá un WhatsApp válido (código de área + número).' }
  }
  if (!input.shopName.trim()) {
    return { error: 'Ingresá el nombre de tu negocio.' }
  }

  const trialEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  const ref = input.referralSlug?.trim() ? slugify(input.referralSlug.trim()) : null

  const { data: shop, error: shopErr } = await supabase
    .from('shops')
    .insert({
      slug: cleanSlug,
      name: input.shopName.trim(),
      description: null,
      whatsapp_e164: wa,
      category_label: input.rubro.trim() || null,
      plan: 'free_trial',
      plan_until: trialEnd,
      active: true,
      referred_by_slug: ref && ref.length >= 3 ? ref : null,
    })
    .select('id')
    .single()

  if (shopErr) {
    if (shopErr.message.includes('unique') || shopErr.code === '23505') {
      return { error: 'Ese link ya está en uso. Elegí otro.' }
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
  return { ok: true, shopName: input.shopName.trim(), shopSlug: cleanSlug }
}
