'use server'

import {
  CHECKOUT_PRODUCTS,
  checkoutProductLabel,
  type PlanCheckoutProduct,
} from '@/lib/plan-checkout'
import {
  createCheckoutPreference,
  isMercadoPagoConfigured,
  mercadoPagoCheckoutUrl,
} from '@/lib/mercadopago'
import {
  checkoutProductDays,
  checkoutProductPriceArs,
  expireStalePendingPlanPayments,
} from '@/lib/plan-payments'
import { syncApprovedPlanPaymentFromMercadoPago, syncApprovedPlanPaymentFromMercadoPagoOrder } from '@/lib/mercadopago-plan-sync'
import { createPlanQrCode } from '@/lib/mercadopago-qr'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { fetchUserShops } from '@/lib/shops'
import { isPlatformAdmin } from '@/lib/admin'
import { revalidatePath } from 'next/cache'

export type PlanCheckoutResult =
  | { ok: true; checkoutUrl: string }
  | { error: string }

export type PlanQrResult =
  | { ok: true; qrData: string; mpOrderId: string }
  | { error: string }

export async function createPlanCheckout(
  product: PlanCheckoutProduct,
): Promise<PlanCheckoutResult> {
  if (!isMercadoPagoConfigured()) {
    return { error: 'El pago online no está disponible. Escribinos por WhatsApp.' }
  }

  if (product === 'test_andy' && !(await isPlatformAdmin())) {
    return { error: 'El plan de prueba solo está disponible para administradores.' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Tenés que iniciar sesión.' }

  const shops = await fetchUserShops(supabase)
  const shop = shops[0]
  if (!shop) return { error: 'No encontramos tu tienda.' }

  const meta = CHECKOUT_PRODUCTS[product]
  const amount = checkoutProductPriceArs(product)
  const days = checkoutProductDays(product)
  const service = createServiceClient()
  await expireStalePendingPlanPayments(shop.id)

  const { data: paymentRow, error: insertErr } = await service
    .from('shop_plan_payments')
    .insert({
      shop_id: shop.id,
      plan: product,
      amount_ars: amount,
      days_added: days,
      status: 'pending',
    })
    .select('id')
    .single()

  if (insertErr || !paymentRow) {
    return { error: insertErr?.message ?? 'No se pudo iniciar el pago.' }
  }

  try {
    const preference = await createCheckoutPreference({
      title: `Mendoshop — ${checkoutProductLabel(product)} (${days} día${days === 1 ? '' : 's'})`,
      unitPriceArs: amount,
      externalReference: paymentRow.id,
      payerEmail: user.email,
    })

    await service
      .from('shop_plan_payments')
      .update({
        mp_preference_id: preference.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', paymentRow.id)

    return { ok: true, checkoutUrl: mercadoPagoCheckoutUrl(preference) }
  } catch (e) {
    await service
      .from('shop_plan_payments')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', paymentRow.id)
    const message = e instanceof Error ? e.message : 'Error al conectar con Mercado Pago.'
    return { error: message }
  }
}

export async function createPlanQr(product: PlanCheckoutProduct): Promise<PlanQrResult> {
  if (!isMercadoPagoConfigured()) {
    return { error: 'El pago online no está disponible. Escribinos por WhatsApp.' }
  }

  if (product === 'test_andy' && !(await isPlatformAdmin())) {
    return { error: 'El plan de prueba solo está disponible para administradores.' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Tenés que iniciar sesión.' }

  const shops = await fetchUserShops(supabase)
  const shop = shops[0]
  if (!shop) return { error: 'No encontramos tu tienda.' }

  const amount = checkoutProductPriceArs(product)
  const days = checkoutProductDays(product)
  const service = createServiceClient()
  await expireStalePendingPlanPayments(shop.id)

  const { data: paymentRow, error: insertErr } = await service
    .from('shop_plan_payments')
    .insert({
      shop_id: shop.id,
      plan: product,
      amount_ars: amount,
      days_added: days,
      status: 'pending',
    })
    .select('id')
    .single()

  if (insertErr || !paymentRow) {
    return { error: insertErr?.message ?? 'No se pudo iniciar el pago.' }
  }

  const qrRes = await createPlanQrCode({
    product,
    externalReference: paymentRow.id,
    unitPriceArs: amount,
    daysAdded: days,
  })

  if ('error' in qrRes) {
    await service
      .from('shop_plan_payments')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', paymentRow.id)
    return { error: qrRes.error }
  }

  await service
    .from('shop_plan_payments')
    .update({
      mp_preference_id: qrRes.mpOrderId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', paymentRow.id)

  return { ok: true, qrData: qrRes.qrData, mpOrderId: qrRes.mpOrderId }
}

export async function mercadoPagoPaymentsEnabled(): Promise<boolean> {
  return isMercadoPagoConfigured()
}

/** Al volver de MP (success), activa el plan solo si MP confirma pago aprobado. */
export async function confirmPlanPaymentFromReturn(input: {
  mpPaymentId?: string | null
}): Promise<{ ok: true; activated: boolean } | { error: string }> {
  if (!isMercadoPagoConfigured()) {
    return { error: 'Mercado Pago no está configurado.' }
  }

  const mpPaymentId = input.mpPaymentId?.trim()
  if (!mpPaymentId) {
    return { ok: true, activated: false }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Tenés que iniciar sesión.' }

  const shops = await fetchUserShops(supabase)
  const shop = shops[0]
  if (!shop) return { error: 'No encontramos tu tienda.' }

  try {
    return await syncApprovedPlanPaymentFromMercadoPago(mpPaymentId, { shopId: shop.id })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'No se pudo verificar el pago.'
    return { error: message }
  }
}

/** Consulta Mercado Pago por una orden QR y activa el plan si ya se acreditó. */
export async function syncPlanPaymentFromQrOrder(
  mpOrderId: string,
): Promise<{ ok: true; activated: boolean } | { error: string }> {
  if (!isMercadoPagoConfigured()) {
    return { error: 'Mercado Pago no está configurado.' }
  }

  const orderId = mpOrderId.trim()
  if (!orderId.startsWith('ORD')) {
    return { error: 'Identificador de orden QR inválido.' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Tenés que iniciar sesión.' }

  const shops = await fetchUserShops(supabase)
  const shop = shops[0]
  if (!shop) return { error: 'No encontramos tu tienda.' }

  try {
    return await syncApprovedPlanPaymentFromMercadoPagoOrder(orderId, { shopId: shop.id })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'No se pudo verificar el pago.'
    return { error: message }
  }
}

/** Al abrir la cuenta, intenta activar pagos QR pendientes ya acreditados en MP. */
export async function syncPendingPlanQrPaymentsForShop(): Promise<{ activated: boolean }> {
  if (!isMercadoPagoConfigured()) return { activated: false }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { activated: false }

  const shops = await fetchUserShops(supabase)
  const shop = shops[0]
  if (!shop) return { activated: false }

  const service = createServiceClient()
  const { data: rows, error } = await service
    .from('shop_plan_payments')
    .select('mp_preference_id')
    .eq('shop_id', shop.id)
    .eq('status', 'pending')
    .like('mp_preference_id', 'ORD%')

  if (error || !rows?.length) return { activated: false }

  let activated = false
  for (const row of rows) {
    const orderId = row.mp_preference_id?.trim()
    if (!orderId) continue
    try {
      const result = await syncApprovedPlanPaymentFromMercadoPagoOrder(orderId, { shopId: shop.id })
      if ('error' in result) continue
      if (result.activated) activated = true
    } catch {
      // seguir con otras órdenes pendientes
    }
  }

  if (activated) {
    revalidatePath('/dashboard/account')
    revalidatePath('/dashboard/account/plan')
  }

  return { activated }
}
