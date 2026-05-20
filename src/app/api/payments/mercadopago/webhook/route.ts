import { NextResponse } from 'next/server'
import { fetchMercadoPagoPayment, isMercadoPagoConfigured } from '@/lib/mercadopago'
import { fulfillPlanPayment } from '@/lib/plan-payments'
import { createServiceClient } from '@/lib/supabase/service'
import { revalidatePath } from 'next/cache'

function paymentIdFromRequest(req: Request, body: Record<string, unknown>): string | null {
  const url = new URL(req.url)
  const fromQuery = url.searchParams.get('data.id') ?? url.searchParams.get('id')
  if (fromQuery) return fromQuery

  const data = body.data
  if (data && typeof data === 'object' && 'id' in data) {
    const id = (data as { id?: unknown }).id
    if (typeof id === 'string' || typeof id === 'number') return String(id)
  }
  return null
}

async function syncPayment(mpPaymentId: string) {
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

  if (mpPayment.status === 'approved') {
    await service.from('shop_plan_payments').update(patch).eq('id', row.id)
    await fulfillPlanPayment(row.id)
    revalidatePath('/dashboard/account')
    return
  }

  if (mpPayment.status === 'rejected' || mpPayment.status === 'cancelled') {
    patch.status = 'rejected'
    await service.from('shop_plan_payments').update(patch).eq('id', row.id)
    return
  }

  await service.from('shop_plan_payments').update(patch).eq('id', row.id)
}

export async function POST(req: Request) {
  if (!isMercadoPagoConfigured()) {
    return NextResponse.json({ ok: false }, { status: 503 })
  }

  let body: Record<string, unknown> = {}
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    body = {}
  }

  const paymentId = paymentIdFromRequest(req, body)
  if (!paymentId) {
    return NextResponse.json({ ok: true })
  }

  try {
    await syncPayment(paymentId)
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('mercadopago webhook', e)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}

/** IPN legacy (query topic=payment&id=...) */
export async function GET(req: Request) {
  if (!isMercadoPagoConfigured()) {
    return NextResponse.json({ ok: false }, { status: 503 })
  }

  const url = new URL(req.url)
  const topic = url.searchParams.get('topic')
  const id = url.searchParams.get('id')

  if (topic !== 'payment' || !id) {
    return NextResponse.json({ ok: true })
  }

  try {
    await syncPayment(id)
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('mercadopago webhook GET', e)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
