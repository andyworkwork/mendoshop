import type { PlanCheckoutProduct } from '@/lib/plan-checkout'
import { checkoutProductLabel } from '@/lib/plan-checkout'

const MP_API = 'https://api.mercadopago.com'

function accessToken(): string {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim()
  if (!token) throw new Error('Mercado Pago no está configurado.')
  return token
}

function mpHeaders(): HeadersInit {
  return {
    Authorization: `Bearer ${accessToken()}`,
    'Content-Type': 'application/json',
  }
}

export type CreatePlanQrResult =
  | { ok: true; qrData: string; mpOrderId: string }
  | { error: string }

/**
 * Crea un QR de pago (In-Person Payments / QR Code) para la compra de un plan.
 * Devuelve `type_response.qr_data` para renderizarlo como QR en el frontend.
 */
export async function createPlanQrCode(input: {
  product: PlanCheckoutProduct
  externalReference: string
  unitPriceArs: number
  daysAdded: number
}): Promise<CreatePlanQrResult> {
  const amount = input.unitPriceArs

  // La descripción tiene un máximo de 150 chars (según docs).
  const title = `Mendoshop — ${checkoutProductLabel(input.product)}`
  const description = `${title} (${input.daysAdded} día${input.daysAdded === 1 ? '' : 's'}).`

  const payload: Record<string, unknown> = {
    type: 'qr',
    total_amount: String(amount),
    description,
    external_reference: input.externalReference,
    expiration_time: 'PT10M',
    config: {
      qr: {
        // "dynamic" devuelve `qr_data` en `type_response`.
        mode: 'dynamic',
      },
    },
    transactions: {
      payments: {
        amount: String(amount),
      },
    },
    items: {
      title,
      unit_price: String(amount),
      quantity: 1,
      // No es obligatorio, pero sirve para cumplir el esquema.
      unit_measure: 'unit',
    },
  }

  const idempotencyKey = `shop_plan_qr:${input.externalReference}`

  const res = await fetch(`${MP_API}/v1/orders`, {
    method: 'POST',
    headers: {
      ...mpHeaders(),
      'X-Idempotency-Key': idempotencyKey,
    },
    body: JSON.stringify(payload),
  })

  const body = (await res.json()) as Record<string, unknown> & {
    id?: string
    type_response?: { qr_data?: string }
    message?: string
    error?: string
  }

  if (!res.ok) {
    return { error: body.message ?? body.error ?? `Mercado Pago respondió ${res.status}` }
  }

  const qrData = body.type_response?.qr_data
  const mpOrderId = body.id
  if (!qrData || !mpOrderId) {
    return { error: 'Mercado Pago no devolvió el QR.' }
  }

  return { ok: true, qrData: String(qrData), mpOrderId: String(mpOrderId) }
}

