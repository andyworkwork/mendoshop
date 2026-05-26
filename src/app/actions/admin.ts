'use server'

import { createServiceClient } from '@/lib/supabase/service'
import { createClient } from '@/lib/supabase/server'
import { formatMoneyArs, slugify } from '@/lib/format'
import {
  SANITIZE_LIMITS,
  sanitizePlainText,
  sanitizePlainTextOrNull,
  sanitizeWhatsAppDigits,
} from '@/lib/sanitize'
import { isPlatformAdmin } from '@/lib/admin'
import { extendPlanUntil, planLabel } from '@/lib/plans'
import { expireAllStalePendingPlanPayments, expireStalePendingPlanPayments } from '@/lib/plan-payments'
import { checkoutProductLabel, isPlanCheckoutProduct } from '@/lib/plan-checkout'
import { revalidatePath } from 'next/cache'
import { buildInfraUsageReport, type InfraUsageReport } from '@/lib/infra-usage'
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
  const shopName = sanitizePlainText(input.shopName, SANITIZE_LIMITS.shopName)
  const wa = sanitizeWhatsAppDigits(input.whatsapp)
  const rubro = sanitizePlainTextOrNull(input.rubro ?? '', SANITIZE_LIMITS.categoryLabel)
  const plan = input.plan ?? 'free_trial'
  const trialDays = input.trialDays ?? 7

  if (!email || password.length < 6) {
    return { error: 'Email y contraseña (mín. 6 caracteres) son obligatorios.' }
  }
  if (!shopName) {
    return { error: 'El nombre de la tienda no es válido.' }
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
      name: shopName,
      description: null,
      whatsapp_e164: wa,
      category_label: rubro,
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
  revalidatePath('/admin/crear-cuenta')
  revalidatePath('/admin/historial-planes')
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
  revalidatePath('/')
  revalidatePath('/admin')
  revalidatePath('/admin/crear-cuenta')
  revalidatePath('/admin/historial-planes')
  revalidatePath('/dashboard/account')
  return { ok: true }
}

export async function updateShopSlugAdmin(input: {
  shopId: string
  slug: string
}): Promise<AdminActionResult> {
  const denied = await assertAdmin()
  if (denied) return denied

  const cleanSlug = slugify(input.slug)
  if (cleanSlug.length < 3) {
    return { error: 'El link debe tener al menos 3 caracteres (solo letras, números y guiones).' }
  }

  const service = createServiceClient()
  const { data: shop, error: fetchErr } = await service
    .from('shops')
    .select('slug')
    .eq('id', input.shopId)
    .maybeSingle()

  if (fetchErr || !shop) return { error: fetchErr?.message ?? 'Tienda no encontrada.' }
  const oldSlug = shop.slug as string
  if (oldSlug === cleanSlug) return { error: 'El link es el mismo que el actual.' }

  const { data: taken } = await service
    .from('shops')
    .select('id')
    .eq('slug', cleanSlug)
    .neq('id', input.shopId)
    .maybeSingle()

  if (taken) return { error: 'Ese link de tienda ya está en uso.' }

  const { error } = await service.from('shops').update({ slug: cleanSlug }).eq('id', input.shopId)
  if (error) {
    if (error.message.includes('unique') || error.code === '23505') {
      return { error: 'Ese link de tienda ya está en uso.' }
    }
    return { error: error.message }
  }

  revalidatePath('/admin')
  revalidatePath('/admin/crear-cuenta')
  revalidatePath('/admin/historial-planes')
  revalidatePath(`/tienda/${oldSlug}`)
  revalidatePath(`/tienda/${cleanSlug}`)
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/editar-tienda')
  revalidatePath('/dashboard/settings')
  revalidatePath('/dashboard/catalog')
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
  revalidatePath('/admin/crear-cuenta')
  revalidatePath('/admin/historial-planes')
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

export type ShopPlanGrantAdminRow = {
  id: string
  days_added: number
  reason: string
  created_at: string
}

export type ShopPlanPaymentAdminRow = {
  id: string
  plan: string
  amount_ars: number
  days_added: number
  status: string
  created_at: string
}

export type ShopPlanActivity = {
  grants: ShopPlanGrantAdminRow[]
  payments: ShopPlanPaymentAdminRow[]
}

export async function fetchShopPlanActivity(shopId: string): Promise<ShopPlanActivity | { error: string }> {
  const denied = await assertAdmin()
  if (denied) return denied

  const service = createServiceClient()
  await expireStalePendingPlanPayments(shopId)

  const [grantsRes, paymentsRes] = await Promise.all([
    service
      .from('shop_plan_grants')
      .select('id, days_added, reason, created_at')
      .eq('shop_id', shopId)
      .order('created_at', { ascending: false })
      .limit(20),
    service
      .from('shop_plan_payments')
      .select('id, plan, amount_ars, days_added, status, created_at')
      .eq('shop_id', shopId)
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  if (grantsRes.error) return { error: grantsRes.error.message }
  if (paymentsRes.error) return { error: paymentsRes.error.message }

  return {
    grants: (grantsRes.data ?? []) as ShopPlanGrantAdminRow[],
    payments: (paymentsRes.data ?? []).map((p) => ({
      ...p,
      amount_ars: Number(p.amount_ars),
    })) as ShopPlanPaymentAdminRow[],
  }
}

export async function setShopPlanAdmin(input: {
  shopId: string
  plan: ShopPlan
  reason?: string
}): Promise<AdminActionResult> {
  const denied = await assertAdmin()
  if (denied) return denied

  const service = createServiceClient()
  const { data: shop, error: fetchErr } = await service
    .from('shops')
    .select('plan')
    .eq('id', input.shopId)
    .maybeSingle()

  if (fetchErr) return { error: fetchErr.message }
  if (!shop) return { error: 'Tienda no encontrada.' }
  if (shop.plan === input.plan) return { ok: true }

  const reason =
    input.reason?.trim() ||
    `Plan cambiado a ${planLabel(input.plan)} por administración Mendoshop.`

  const { error: grantErr } = await service.from('shop_plan_grants').insert({
    shop_id: input.shopId,
    days_added: 0,
    reason,
  })

  if (grantErr) return { error: grantErr.message }

  const { error: updateErr } = await service
    .from('shops')
    .update({ plan: input.plan })
    .eq('id', input.shopId)

  if (updateErr) return { error: updateErr.message }

  revalidatePath('/admin')
  revalidatePath('/admin/historial-planes')
  revalidatePath('/dashboard/account')
  return { ok: true }
}

export type GlobalPlanLogEntry = {
  id: string
  kind: 'grant' | 'payment'
  shop_id: string
  shop_name: string
  shop_slug: string
  created_at: string
  title: string
  detail: string
  status: string | null
  watch: boolean
}

const GLOBAL_PLAN_LOG_LIMIT = 200

function shopFromJoin(shops: unknown): { name: string; slug: string } {
  const row = Array.isArray(shops) ? shops[0] : shops
  if (row && typeof row === 'object' && 'name' in row && 'slug' in row) {
    const s = row as { name: unknown; slug: unknown }
    return { name: String(s.name), slug: String(s.slug) }
  }
  return { name: '—', slug: '' }
}

export async function listGlobalPlanActivityForAdmin(): Promise<
  GlobalPlanLogEntry[] | { error: string }
> {
  const denied = await assertAdmin()
  if (denied) return denied

  const service = createServiceClient()
  await expireAllStalePendingPlanPayments()

  const [grantsRes, paymentsRes] = await Promise.all([
    service
      .from('shop_plan_grants')
      .select('id, shop_id, days_added, reason, created_at, shops!inner(name, slug)')
      .order('created_at', { ascending: false })
      .limit(GLOBAL_PLAN_LOG_LIMIT),
    service
      .from('shop_plan_payments')
      .select('id, shop_id, plan, amount_ars, days_added, status, created_at, shops!inner(name, slug)')
      .order('created_at', { ascending: false })
      .limit(GLOBAL_PLAN_LOG_LIMIT),
  ])

  if (grantsRes.error) return { error: grantsRes.error.message }
  if (paymentsRes.error) return { error: paymentsRes.error.message }

  const entries: GlobalPlanLogEntry[] = []

  for (const g of grantsRes.data ?? []) {
    const shop = shopFromJoin(g.shops)
    const days = g.days_added as number
    entries.push({
      id: `grant-${g.id}`,
      kind: 'grant',
      shop_id: g.shop_id as string,
      shop_name: shop.name,
      shop_slug: shop.slug,
      created_at: g.created_at as string,
      title: days > 0 ? `+${days} día${days === 1 ? '' : 's'}` : 'Cambio de plan',
      detail: g.reason as string,
      status: null,
      watch: days === 0,
    })
  }

  for (const p of paymentsRes.data ?? []) {
    const shop = shopFromJoin(p.shops)
    const plan = p.plan as string
    const amount = Number(p.amount_ars)
    const label = isPlanCheckoutProduct(plan)
      ? checkoutProductLabel(plan)
      : planLabel(plan as ShopPlan)
    const status = p.status as string
    entries.push({
      id: `payment-${p.id}`,
      kind: 'payment',
      shop_id: p.shop_id as string,
      shop_name: shop.name,
      shop_slug: shop.slug,
      created_at: p.created_at as string,
      title: `Pago MP — ${label}`,
      detail: `${formatMoneyArs(amount, amount < 1 ? 2 : undefined)} · +${p.days_added} día${p.days_added === 1 ? '' : 's'}`,
      status,
      watch: status === 'pending' || status === 'rejected',
    })
  }

  entries.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  )

  return entries.slice(0, GLOBAL_PLAN_LOG_LIMIT)
}

export async function getInfraUsageForAdmin(): Promise<InfraUsageReport | { error: string }> {
  const denied = await assertAdmin()
  if (denied) return denied
  return buildInfraUsageReport()
}
