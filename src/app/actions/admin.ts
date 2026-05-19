'use server'

import { createServiceClient } from '@/lib/supabase/service'
import { createClient } from '@/lib/supabase/server'
import { slugify } from '@/lib/format'
import { isPlatformAdmin } from '@/lib/admin'
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
  const trialDays = input.trialDays ?? 14

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
