'use server'

import {
  createCheckoutPreference,
  isMercadoPagoConfigured,
  mercadoPagoCheckoutUrl,
} from '@/lib/mercadopago'
import { paidPlanPriceArs, type PaidShopPlan } from '@/lib/plan-payments'
import { PLAN_SUBSCRIPTION_DAYS, planLabel } from '@/lib/plans'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { fetchUserShops } from '@/lib/shops'
export type PlanCheckoutResult =
  | { ok: true; checkoutUrl: string }
  | { error: string }

export async function createPlanCheckout(plan: PaidShopPlan): Promise<PlanCheckoutResult> {
  if (!isMercadoPagoConfigured()) {
    return { error: 'El pago online no está disponible. Escribinos por WhatsApp.' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Tenés que iniciar sesión.' }

  const shops = await fetchUserShops(supabase)
  const shop = shops[0]
  if (!shop) return { error: 'No encontramos tu tienda.' }

  const amount = paidPlanPriceArs(plan)
  const service = createServiceClient()

  const { data: paymentRow, error: insertErr } = await service
    .from('shop_plan_payments')
    .insert({
      shop_id: shop.id,
      plan,
      amount_ars: amount,
      days_added: PLAN_SUBSCRIPTION_DAYS,
      status: 'pending',
    })
    .select('id')
    .single()

  if (insertErr || !paymentRow) {
    return { error: insertErr?.message ?? 'No se pudo iniciar el pago.' }
  }

  try {
    const preference = await createCheckoutPreference({
      title: `Mendoshop — Plan ${planLabel(plan)} (${PLAN_SUBSCRIPTION_DAYS} días)`,
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
