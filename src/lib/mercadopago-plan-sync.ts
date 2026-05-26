import {
  fetchMercadoPagoOrder,
  fetchMercadoPagoPayment,
  type MercadoPagoOrder,
} from '@/lib/mercadopago'
import { fulfillPlanPayment } from '@/lib/plan-payments'
import { createServiceClient } from '@/lib/supabase/service'
import { revalidatePath } from 'next/cache'

const AMOUNT_TOLERANCE_ARS = 0.02

type PlanPaymentRow = {
  id: string
  shop_id: string
  status: string
  amount_ars: number
}

function parseMercadoPagoMoney(value: string | null | undefined): number | null {
  if (value == null || value === '') return null
  const n = Number.parseFloat(value)
  return Number.isFinite(n) ? n : null
}

export function isMercadoPagoOrderPaid(order: MercadoPagoOrder): boolean {
  if (order.status === 'processed' && order.status_detail === 'accredited') return true
  return (order.transactions?.payments ?? []).some(
    (payment) => payment.status === 'processed' && payment.status_detail === 'accredited',
  )
}

function mercadoPagoOrderPaidAmount(order: MercadoPagoOrder): number | null {
  const accredited = (order.transactions?.payments ?? []).find(
    (payment) => payment.status === 'processed' && payment.status_detail === 'accredited',
  )
  return (
    parseMercadoPagoMoney(accredited?.paid_amount) ??
    parseMercadoPagoMoney(accredited?.amount) ??
    parseMercadoPagoMoney(order.total_amount)
  )
}

function mercadoPagoOrderPaymentId(order: MercadoPagoOrder): string | null {
  const payment = (order.transactions?.payments ?? []).find((p) => p.status === 'processed')
  const id = payment?.reference_id ?? payment?.id
  return id?.trim() ? id.trim() : null
}

async function findPlanPaymentRowForOrder(
  order: MercadoPagoOrder,
  orderId: string,
  options?: { shopId?: string },
): Promise<PlanPaymentRow | null> {
  const service = createServiceClient()
  const externalRef = order.external_reference?.trim()

  if (externalRef) {
    const { data: row, error } = await service
      .from('shop_plan_payments')
      .select('id, shop_id, status, amount_ars')
      .eq('id', externalRef)
      .maybeSingle()
    if (error) throw new Error(error.message)
    if (row) {
      if (options?.shopId && row.shop_id !== options.shopId) return null
      return row
    }
  }

  const { data: rowByOrder, error: orderErr } = await service
    .from('shop_plan_payments')
    .select('id, shop_id, status, amount_ars')
    .eq('mp_preference_id', orderId)
    .maybeSingle()

  if (orderErr) throw new Error(orderErr.message)
  if (!rowByOrder) return null
  if (options?.shopId && rowByOrder.shop_id !== options.shopId) return null
  return rowByOrder
}

export function mercadoPagoAmountMatchesExpected(
  expected: number,
  paid: number | null | undefined,
): boolean {
  if (paid == null || Number.isNaN(expected)) return false
  return Math.abs(paid - expected) <= AMOUNT_TOLERANCE_ARS
}

/** Activa el plan solo si Mercado Pago reporta el pago aprobado y el monto coincide. */
export async function syncApprovedPlanPaymentFromMercadoPago(
  mpPaymentId: string,
  options?: { shopId?: string },
): Promise<{ ok: true; activated: boolean } | { error: string }> {
  const mpPayment = await fetchMercadoPagoPayment(mpPaymentId)

  if (mpPayment.status !== 'approved') {
    return { ok: true, activated: false }
  }

  const externalRef = mpPayment.external_reference?.trim()
  if (!externalRef) {
    return { ok: true, activated: false }
  }

  const service = createServiceClient()
  const { data: row, error: rowErr } = await service
    .from('shop_plan_payments')
    .select('id, shop_id, status, amount_ars')
    .eq('id', externalRef)
    .maybeSingle()

  if (rowErr) return { error: rowErr.message }
  if (!row) return { ok: true, activated: false }

  if (options?.shopId && row.shop_id !== options.shopId) {
    return { error: 'No encontramos ese pago para tu tienda.' }
  }

  if (row.status === 'approved') {
    return { ok: true, activated: true }
  }

  const expected = Number(row.amount_ars)
  if (!mercadoPagoAmountMatchesExpected(expected, mpPayment.transaction_amount)) {
    console.error('mercadopago amount mismatch', {
      expected,
      paid: mpPayment.transaction_amount,
      paymentId: row.id,
    })
    return { ok: true, activated: false }
  }

  const { error: patchErr } = await service
    .from('shop_plan_payments')
    .update({
      mp_payment_id: String(mpPayment.id),
      updated_at: new Date().toISOString(),
    })
    .eq('id', row.id)

  if (patchErr) return { error: patchErr.message }

  const result = await fulfillPlanPayment(row.id)
  if ('error' in result) return result

  revalidatePath('/dashboard/account')
  return { ok: true, activated: true }
}

/** Actualiza estado del row cuando MP rechaza o cancela (webhook). */
export async function patchPlanPaymentFromMercadoPago(mpPaymentId: string): Promise<void> {
  const mpPayment = await fetchMercadoPagoPayment(mpPaymentId)
  const externalRef = mpPayment.external_reference?.trim()
  if (!externalRef) return

  const service = createServiceClient()
  const { data: row } = await service
    .from('shop_plan_payments')
    .select('id, status')
    .eq('id', externalRef)
    .maybeSingle()

  if (!row) return

  const patch: Record<string, unknown> = {
    mp_payment_id: String(mpPayment.id),
    updated_at: new Date().toISOString(),
  }

  if (mpPayment.status === 'rejected' || mpPayment.status === 'cancelled') {
    patch.status = 'rejected'
    await service.from('shop_plan_payments').update(patch).eq('id', row.id)
    return
  }

  if (mpPayment.status !== 'approved') {
    await service.from('shop_plan_payments').update(patch).eq('id', row.id)
  }
}

/** Activa el plan cuando una orden QR de Mercado Pago queda acreditada. */
export async function syncApprovedPlanPaymentFromMercadoPagoOrder(
  mpOrderId: string,
  options?: { shopId?: string },
): Promise<{ ok: true; activated: boolean } | { error: string }> {
  const order = await fetchMercadoPagoOrder(mpOrderId)

  if (!isMercadoPagoOrderPaid(order)) {
    return { ok: true, activated: false }
  }

  let row: PlanPaymentRow | null
  try {
    row = await findPlanPaymentRowForOrder(order, mpOrderId, options)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'No se pudo buscar el pago.'
    return { error: message }
  }

  if (!row) return { ok: true, activated: false }

  if (options?.shopId && row.shop_id !== options.shopId) {
    return { error: 'No encontramos ese pago para tu tienda.' }
  }

  if (row.status === 'approved') {
    return { ok: true, activated: true }
  }

  const expected = Number(row.amount_ars)
  const paid = mercadoPagoOrderPaidAmount(order)
  if (!mercadoPagoAmountMatchesExpected(expected, paid)) {
    console.error('mercadopago order amount mismatch', {
      expected,
      paid,
      orderId: mpOrderId,
      paymentId: row.id,
    })
    return { ok: true, activated: false }
  }

  const service = createServiceClient()
  const mpPaymentId = mercadoPagoOrderPaymentId(order)
  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }
  if (mpPaymentId) patch.mp_payment_id = mpPaymentId

  const { error: patchErr } = await service.from('shop_plan_payments').update(patch).eq('id', row.id)
  if (patchErr) return { error: patchErr.message }

  const result = await fulfillPlanPayment(row.id)
  if ('error' in result) return result

  revalidatePath('/dashboard/account')
  revalidatePath('/dashboard/account/plan')
  return { ok: true, activated: true }
}

/** Marca rechazos o expiraciones de órdenes QR (webhook). */
export async function patchPlanPaymentFromMercadoPagoOrder(mpOrderId: string): Promise<void> {
  const order = await fetchMercadoPagoOrder(mpOrderId)
  let row: PlanPaymentRow | null
  try {
    row = await findPlanPaymentRowForOrder(order, mpOrderId)
  } catch {
    return
  }
  if (!row) return

  const service = createServiceClient()
  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  const mpPaymentId = mercadoPagoOrderPaymentId(order)
  if (mpPaymentId) patch.mp_payment_id = mpPaymentId

  if (order.status === 'canceled' || order.status === 'expired') {
    patch.status = 'rejected'
    await service.from('shop_plan_payments').update(patch).eq('id', row.id)
    return
  }

  if (!isMercadoPagoOrderPaid(order)) {
    await service.from('shop_plan_payments').update(patch).eq('id', row.id)
  }
}
