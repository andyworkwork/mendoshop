import { fetchMercadoPagoPayment } from '@/lib/mercadopago'
import { fulfillPlanPayment } from '@/lib/plan-payments'
import { createServiceClient } from '@/lib/supabase/service'
import { revalidatePath } from 'next/cache'

const AMOUNT_TOLERANCE_ARS = 0.02

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
