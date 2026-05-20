'use server'

import { createServiceClient } from '@/lib/supabase/service'
import { createClient } from '@/lib/supabase/server'
import { slugify } from '@/lib/format'
import { isPlatformAdmin } from '@/lib/admin'
import { extendPlanUntil } from '@/lib/plans'
import { revalidatePath } from 'next/cache'
import type { ShopPlan } from '@/types/shop'

export type AdminActionResult = { ok: true } | { error: string }

async function assertAdmin() {
  if (!(await isPlatformAdmin())) {
    return { error: 'No tenés permisos de administrador.' } as const
  }
  return null
}

export async function createShopForUser(input: {
  email: string
  password: string
  shopName: string
  slug: string
  whatsapp: string
  rubro?: string
  plan?: ShopPlan
  trialDays?: number
}): Promise<AdminActionResult> {
  const denied = await assertAdmin()
  if (denied) return denied

  const email = input.email.trim().toLowerCase()
  const password = input.password
  const cleanSlug = slugify(input.slug)
  const wa = input.whatsapp.replace(/\D/g, '')
  const plan = input.plan ?? 'free_trial'
  const trialDays = input.trialDays ?? 7

  if (!email || password.length < 6) {
    return { error: 'Email y contraseña (mín. 6 caracteres) son obligatorios.' }
  }
  if (cleanSlug.length < 3) {
    return { error: 'El link de la tienda debe tener al menos 3 caracteres.' }
  }
  if (wa.length < 10) {
    return { error: 'WhatsApp inválido (solo dígitos, con código de país).' }
  }

  const service = createServiceClient()

  const { data: userData, error: userErr } = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (userErr) {
    if (userErr.message.toLowerCase().includes('already')) {
      return { error: 'Ese email ya tiene cuenta. Usá otro email o pedile que entre con su contraseña.' }
    }
    return { error: userErr.message }
  }

  const userId = userData.user?.id
  if (!userId) return { error: 'No se pudo crear el usuario.' }

  const planUntil =
    plan === 'free_trial'
      ? new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000).toISOString()
      : null

  const { data: shop, error: shopErr } = await service
    .from('shops')
    .insert({
      slug: cleanSlug,
      name: input.shopName.trim(),
      description: null,
      whatsapp_e164: wa,
      category_label: input.rubro?.trim() || null,
      plan,
      plan_until: planUntil,
      active: true,
    })
    .select('id')
    .single()

  if (shopErr) {
    await service.auth.admin.deleteUser(userId)
    if (shopErr.message.includes('unique') || shopErr.code === '23505') {
      return { error: 'Ese link de tienda ya está en uso.' }
    }
    return { error: shopErr.message }
  }

  const { error: memberErr } = await service.from('shop_members').insert({
    shop_id: shop.id,
    user_id: userId,
    role: 'owner',
  })

  if (memberErr) {
    await service.from('shops').delete().eq('id', shop.id)
    await service.auth.admin.deleteUser(userId)
    return { error: memberErr.message }
  }

  revalidatePath('/admin')
  return { ok: true }
}

export async function updateShopAdmin(
  shopId: string,
  patch: {
    active?: boolean
    featured?: boolean
    plan?: ShopPlan
    plan_until?: string | null
  },
): Promise<AdminActionResult> {
  const denied = await assertAdmin()
  if (denied) return denied

  const service = createServiceClient()
  const { error } = await service.from('shops').update(patch).eq('id', shopId)
  if (error) return { error: error.message }
  revalidatePath('/admin')
  revalidatePath('/dashboard/account')
  return { ok: true }
}

export async function grantPlanDaysToShop(input: {
  shopId: string
  days: number
  reason: string
}): Promise<AdminActionResult> {
  const denied = await assertAdmin()
  if (denied) return denied

  const days = Math.floor(input.days)
  const reason = input.reason.trim()
  if (days < 1 || days > 365) {
    return { error: 'Los días deben estar entre 1 y 365.' }
  }
  if (reason.length < 3) {
    return { error: 'Escribí un motivo de al menos 3 caracteres.' }
  }

  const service = createServiceClient()
  const { data: shop, error: fetchErr } = await service
    .from('shops')
    .select('plan_until')
    .eq('id', input.shopId)
    .maybeSingle()

  if (fetchErr) return { error: fetchErr.message }
  if (!shop) return { error: 'Tienda no encontrada.' }

  const planUntil = extendPlanUntil(shop.plan_until as string | null, days)

  const { error: grantErr } = await service.from('shop_plan_grants').insert({
    shop_id: input.shopId,
    days_added: days,
    reason,
  })
  if (grantErr) return { error: grantErr.message }

  const { error: updateErr } = await service
    .from('shops')
    .update({ plan_until: planUntil, active: true })
    .eq('id', input.shopId)

  if (updateErr) return { error: updateErr.message }

  revalidatePath('/admin')
  revalidatePath('/dashboard/account')
  return { ok: true }
}

export async function listShopsForAdmin() {
  if (!(await isPlatformAdmin())) return []

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('shops')
    .select('id, slug, name, plan, plan_until, active, featured, whatsapp_e164, category_label, created_at')
    .order('created_at', { ascending: false })

  if (error) return []
  return data ?? []
}
