import {
  CHECKOUT_PRODUCTS,
  checkoutProductLabel,
  type PlanCheckoutProduct,
} from '@/lib/plan-checkout'
import { extendPlanUntil, planLabel } from '@/lib/plans'
import { createServiceClient } from '@/lib/supabase/service'
import type { ShopPlan } from '@/types/shop'

export type { PlanCheckoutProduct } from '@/lib/plan-checkout'

export function checkoutProductPriceArs(product: PlanCheckoutProduct): number {
  return CHECKOUT_PRODUCTS[product].priceArs
}

export function checkoutProductDays(product: PlanCheckoutProduct): number {
  return CHECKOUT_PRODUCTS[product].daysAdded
}

/** Intentos de pago sin completar en MP pasan a cancelled tras este tiempo. */
export const PENDING_PLAN_PAYMENT_TTL_MINUTES = 5

/** Marca como cancelados los pending viejos (checkout abandonado). */
export async function expireStalePendingPlanPayments(
  shopId: string,
  ttlMinutes: number = PENDING_PLAN_PAYMENT_TTL_MINUTES,
): Promise<void> {
  const service = createServiceClient()
  const cutoff = new Date(Date.now() - ttlMinutes * 60 * 1000).toISOString()
  await service
    .from('shop_plan_payments')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString(),
    })
    .eq('shop_id', shopId)
    .eq('status', 'pending')
    .lt('created_at', cutoff)
}

export async function expireAllStalePendingPlanPayments(
  ttlMinutes: number = PENDING_PLAN_PAYMENT_TTL_MINUTES,
): Promise<void> {
  const service = createServiceClient()
  const cutoff = new Date(Date.now() - ttlMinutes * 60 * 1000).toISOString()
  await service
    .from('shop_plan_payments')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString(),
    })
    .eq('status', 'pending')
    .lt('created_at', cutoff)
}

/** Activa o renueva tras un pago aprobado (un solo grant por pago pending). */
export async function fulfillPlanPayment(paymentId: string): Promise<{ ok: true } | { error: string }> {
  const service = createServiceClient()
  const now = new Date().toISOString()

  const { data: row, error: fetchErr } = await service
    .from('shop_plan_payments')
    .select('id, shop_id, plan, status, days_added, mp_payment_id')
    .eq('id', paymentId)
    .maybeSingle()

  if (fetchErr) return { error: fetchErr.message }
  if (!row) return { error: 'Pago no encontrado.' }
  if (row.status === 'approved') return { ok: true }

  const { data: claimed, error: claimErr } = await service
    .from('shop_plan_payments')
    .update({ status: 'approved', updated_at: now })
    .eq('id', paymentId)
    .eq('status', 'pending')
    .select('id, shop_id, plan, days_added')
    .maybeSingle()

  if (claimErr) return { error: claimErr.message }
  if (!claimed) {
    const { data: again } = await service
      .from('shop_plan_payments')
      .select('status')
      .eq('id', paymentId)
      .maybeSingle()
    if (again?.status === 'approved') return { ok: true }
    return { error: 'El pago no está pendiente.' }
  }

  const product = claimed.plan as PlanCheckoutProduct
  const meta = CHECKOUT_PRODUCTS[product]
  if (!meta) return { error: 'Producto de pago desconocido.' }

  const days = claimed.days_added ?? meta.daysAdded

  const { data: shop, error: shopErr } = await service
    .from('shops')
    .select('plan, plan_until')
    .eq('id', claimed.shop_id)
    .maybeSingle()

  if (shopErr) return { error: shopErr.message }
  if (!shop) return { error: 'Tienda no encontrada.' }

  const planUntil = extendPlanUntil(shop.plan_until as string | null, days)
  const reason =
    product === 'test_andy'
      ? `Pago Mercado Pago — ${checkoutProductLabel(product)} (+${days} día)`
      : `Pago Mercado Pago — plan ${checkoutProductLabel(product)} (${days} días)`

  const { error: grantErr } = await service.from('shop_plan_grants').insert({
    shop_id: claimed.shop_id,
    days_added: days,
    reason,
  })
  if (grantErr) return { error: grantErr.message }

  const shopPatch: { plan_until: string; active: boolean; plan?: ShopPlan } = {
    plan_until: planUntil,
    active: true,
  }
  if (meta.shopPlanOnPay) {
    shopPatch.plan = meta.shopPlanOnPay
  }

  const { error: shopUpdateErr } = await service.from('shops').update(shopPatch).eq('id', claimed.shop_id)

  if (shopUpdateErr) return { error: shopUpdateErr.message }

  return { ok: true }
}
