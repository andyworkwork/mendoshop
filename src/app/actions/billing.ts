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
import { fetchMercadoPagoPayment } from '@/lib/mercadopago'
import { fulfillPlanPayment } from '@/lib/plan-payments'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { fetchUserShops } from '@/lib/shops'
import { isPlatformAdmin } from '@/lib/admin'
import { revalidatePath } from 'next/cache'

export type PlanCheckoutResult =
  | { ok: true; checkoutUrl: string }
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

export async function mercadoPagoPaymentsEnabled(): Promise<boolean> {
  return isMercadoPagoConfigured()
}

/** Al volver de MP (success), confirma el pago si el webhook aún no corrió. */
export async function confirmPlanPaymentFromReturn(input: {
  mpPaymentId?: string | null
  externalReference?: string | null
}): Promise<{ ok: true; activated: boolean } | { error: string }> {
  if (!isMercadoPagoConfigured()) {
    return { error: 'Mercado Pago no está configurado.' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Tenés que iniciar sesión.' }

  const shops = await fetchUserShops(supabase)
  const shop = shops[0]
  if (!shop) return { error: 'No encontramos tu tienda.' }

  let paymentRowId = input.externalReference?.trim() || null

  if (input.mpPaymentId) {
    try {
      const mpPayment = await fetchMercadoPagoPayment(input.mpPaymentId)
      if (mpPayment.external_reference?.trim()) {
        paymentRowId = mpPayment.external_reference.trim()
      }
      if (mpPayment.status !== 'approved') {
        return { ok: true, activated: false }
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : 'No se pudo verificar el pago.'
      return { error: message }
    }
  }

  if (!paymentRowId) {
    return { ok: true, activated: false }
  }

  const service = createServiceClient()
  const { data: row, error: rowErr } = await service
    .from('shop_plan_payments')
    .select('id, shop_id, status')
    .eq('id', paymentRowId)
    .maybeSingle()

  if (rowErr) return { error: rowErr.message }
  if (!row || row.shop_id !== shop.id) {
    return { error: 'No encontramos ese pago para tu tienda.' }
  }
  if (row.status === 'approved') {
    revalidatePath('/dashboard/account')
    return { ok: true, activated: true }
  }

  const result = await fulfillPlanPayment(row.id)
  if ('error' in result) return result

  revalidatePath('/dashboard/account')
  return { ok: true, activated: true }
}
