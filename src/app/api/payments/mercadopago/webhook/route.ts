import { NextResponse } from 'next/server'
import { isMercadoPagoConfigured } from '@/lib/mercadopago'
import {
  isMercadoPagoWebhookSignatureRequired,
  mercadoPagoWebhookDataIdFromUrl,
  mercadoPagoWebhookSecret,
  verifyMercadoPagoWebhookSignature,
} from '@/lib/mercadopago-webhook-signature'
import {
  patchPlanPaymentFromMercadoPago,
  patchPlanPaymentFromMercadoPagoOrder,
  syncApprovedPlanPaymentFromMercadoPago,
  syncApprovedPlanPaymentFromMercadoPagoOrder,
} from '@/lib/mercadopago-plan-sync'

const SIGNATURE_MAX_AGE_SECONDS = 60 * 60 * 24

function paymentIdFromRequest(req: Request, body: Record<string, unknown>): string | null {
  const url = new URL(req.url)
  const fromQuery = url.searchParams.get('data.id') ?? url.searchParams.get('id')
  if (fromQuery && !fromQuery.startsWith('ORD')) return fromQuery

  const data = body.data
  if (data && typeof data === 'object' && 'id' in data) {
    const id = (data as { id?: unknown }).id
    if (typeof id === 'string' || typeof id === 'number') {
      const asString = String(id)
      if (!asString.startsWith('ORD')) return asString
    }
  }
  return null
}

function orderIdFromRequest(req: Request, body: Record<string, unknown>): string | null {
  const url = new URL(req.url)
  const fromQuery = url.searchParams.get('data.id') ?? url.searchParams.get('id')
  if (fromQuery?.startsWith('ORD')) return fromQuery

  const bodyType = typeof body.type === 'string' ? body.type.toLowerCase() : ''
  const action = typeof body.action === 'string' ? body.action.toLowerCase() : ''
  const data = body.data
  if (data && typeof data === 'object' && 'id' in data) {
    const id = (data as { id?: unknown }).id
    if (typeof id === 'string' || typeof id === 'number') {
      const asString = String(id)
      if (asString.startsWith('ORD')) return asString
    }
  }

  if (bodyType === 'order' || action.startsWith('order.')) {
    if (data && typeof data === 'object' && 'id' in data) {
      const id = (data as { id?: unknown }).id
      if (typeof id === 'string' || typeof id === 'number') return String(id)
    }
  }

  return null
}

function unauthorized(reason: string) {
  console.warn('mercadopago webhook: unauthorized', reason)
  return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
}

function verifyRequestSignature(req: Request): NextResponse | null {
  const secret = mercadoPagoWebhookSecret()
  if (!secret) return null

  const url = new URL(req.url)
  const ok = verifyMercadoPagoWebhookSignature({
    xSignature: req.headers.get('x-signature'),
    xRequestId: req.headers.get('x-request-id'),
    dataId: mercadoPagoWebhookDataIdFromUrl(url),
    secret,
    maxAgeSeconds: SIGNATURE_MAX_AGE_SECONDS,
  })

  if (!ok) return unauthorized('invalid or missing x-signature')
  return null
}

async function syncPayment(mpPaymentId: string) {
  const approved = await syncApprovedPlanPaymentFromMercadoPago(mpPaymentId)
  if ('error' in approved) throw new Error(approved.error)
  if (approved.activated) return

  await patchPlanPaymentFromMercadoPago(mpPaymentId)
}

async function syncOrder(mpOrderId: string) {
  const approved = await syncApprovedPlanPaymentFromMercadoPagoOrder(mpOrderId)
  if ('error' in approved) throw new Error(approved.error)
  if (approved.activated) return

  await patchPlanPaymentFromMercadoPagoOrder(mpOrderId)
}

export async function POST(req: Request) {
  if (!isMercadoPagoConfigured()) {
    return NextResponse.json({ ok: false }, { status: 503 })
  }

  const authError = verifyRequestSignature(req)
  if (authError) return authError

  let body: Record<string, unknown> = {}
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    body = {}
  }

  const orderId = orderIdFromRequest(req, body)
  if (orderId) {
    try {
      await syncOrder(orderId)
      return NextResponse.json({ ok: true })
    } catch (e) {
      console.error('mercadopago webhook order', e)
      return NextResponse.json({ ok: false }, { status: 500 })
    }
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

/**
 * IPN legacy (topic=payment&id=…). Sin x-signature: solo si no hay secret configurado.
 * Preferí webhooks POST firmados en el panel de MP.
 */
export async function GET(req: Request) {
  if (!isMercadoPagoConfigured()) {
    return NextResponse.json({ ok: false }, { status: 503 })
  }

  if (isMercadoPagoWebhookSignatureRequired()) {
    const authError = verifyRequestSignature(req)
    if (authError) return authError
  }

  const url = new URL(req.url)
  const topic = url.searchParams.get('topic')
  const id = url.searchParams.get('id')

  if (id?.startsWith('ORD')) {
    try {
      await syncOrder(id)
      return NextResponse.json({ ok: true })
    } catch (e) {
      console.error('mercadopago webhook GET order', e)
      return NextResponse.json({ ok: false }, { status: 500 })
    }
  }

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
