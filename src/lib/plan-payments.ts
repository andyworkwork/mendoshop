import { extendPlanUntil, PLAN_PRICES_ARS, PLAN_SUBSCRIPTION_DAYS, planLabel } from '@/lib/plans'
import { createServiceClient } from '@/lib/supabase/service'
import type { ShopPlan } from '@/types/shop'

export type PaidShopPlan = Exclude<ShopPlan, 'free_trial'>

export function paidPlanPriceArs(plan: PaidShopPlan): number {
  return PLAN_PRICES_ARS[plan]
}

/** Activa o renueva el plan tras un pago aprobado (idempotente por mp_payment_id). */
export async function fulfillPlanPayment(paymentId: string): Promise<{ ok: true } | { error: string }> {
  const service = createServiceClient()

  const { data: row, error: fetchErr } = await service
    .from('shop_plan_payments')
    .select('id, shop_id, plan, status, days_added, mp_payment_id')
    .eq('id', paymentId)
    .maybeSingle()

  if (fetchErr) return { error: fetchErr.message }
  if (!row) return { error: 'Pago no encontrado.' }
  if (row.status === 'approved') return { ok: true }

  const plan = row.plan as PaidShopPlan
  const days = row.days_added ?? PLAN_SUBSCRIPTION_DAYS

  const { data: shop, error: shopErr } = await service
    .from('shops')
    .select('plan_until')
    .eq('id', row.shop_id)
    .maybeSingle()

  if (shopErr) return { error: shopErr.message }
  if (!shop) return { error: 'Tienda no encontrada.' }

  const planUntil = extendPlanUntil(shop.plan_until as string | null, days)
  const reason = `Pago Mercado Pago — plan ${planLabel(plan)} (${days} días)`

  const { error: grantErr } = await service.from('shop_plan_grants').insert({
    shop_id: row.shop_id,
    days_added: days,
    reason,
  })
  if (grantErr) return { error: grantErr.message }

  const { error: shopUpdateErr } = await service
    .from('shops')
    .update({ plan, plan_until: planUntil, active: true })
    .eq('id', row.shop_id)

  if (shopUpdateErr) return { error: shopUpdateErr.message }

  const { error: payUpdateErr } = await service
    .from('shop_plan_payments')
    .update({
      status: 'approved',
      updated_at: new Date().toISOString(),
    })
    .eq('id', paymentId)

  if (payUpdateErr) return { error: payUpdateErr.message }

  return { ok: true }
}
