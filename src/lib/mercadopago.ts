import { appBaseUrl } from '@/lib/app-url'

const MP_API = 'https://api.mercadopago.com'

export function isMercadoPagoConfigured(): boolean {
  return Boolean(process.env.MERCADOPAGO_ACCESS_TOKEN?.trim())
}

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

export type MercadoPagoPreference = {
  id: string
  init_point: string
  sandbox_init_point?: string
}

export async function createCheckoutPreference(input: {
  title: string
  unitPriceArs: number
  externalReference: string
  payerEmail?: string | null
}): Promise<MercadoPagoPreference> {
  const base = appBaseUrl()
  const accountPath = '/dashboard/account'

  const res = await fetch(`${MP_API}/checkout/preferences`, {
    method: 'POST',
    headers: mpHeaders(),
    body: JSON.stringify({
      items: [
        {
          title: input.title,
          quantity: 1,
          unit_price: input.unitPriceArs,
          currency_id: 'ARS',
        },
      ],
      payer: input.payerEmail ? { email: input.payerEmail } : undefined,
      external_reference: input.externalReference,
      notification_url: `${base}/api/payments/mercadopago/webhook`,
      back_urls: {
        success: `${base}${accountPath}?payment=success`,
        failure: `${base}${accountPath}?payment=failure`,
        pending: `${base}${accountPath}?payment=pending`,
      },
      auto_return: 'approved',
    }),
  })

  const body = (await res.json()) as MercadoPagoPreference & { message?: string; error?: string }
  if (!res.ok) {
    throw new Error(body.message ?? body.error ?? `Mercado Pago respondió ${res.status}`)
  }
  if (!body.init_point) {
    throw new Error('Mercado Pago no devolvió URL de pago.')
  }
  return body
}

export function mercadoPagoCheckoutUrl(preference: MercadoPagoPreference): string {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN ?? ''
  if (token.startsWith('TEST-') && preference.sandbox_init_point) {
    return preference.sandbox_init_point
  }
  return preference.init_point
}

export type MercadoPagoPayment = {
  id: number
  status: string
  status_detail?: string
  external_reference?: string | null
  transaction_amount?: number
}

export async function fetchMercadoPagoPayment(paymentId: string): Promise<MercadoPagoPayment> {
  const res = await fetch(`${MP_API}/v1/payments/${paymentId}`, {
    headers: mpHeaders(),
    cache: 'no-store',
  })
  const body = (await res.json()) as MercadoPagoPayment & { message?: string }
  if (!res.ok) {
    throw new Error(body.message ?? `No se pudo consultar el pago ${paymentId}`)
  }
  return body
}
