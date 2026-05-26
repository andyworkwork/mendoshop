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

/** MP no acepta localhost/127.0.0.1 en back_urls ni auto_return. */
export function mercadoPagoSupportsBackUrls(baseUrl: string): boolean {
  try {
    const { hostname, protocol } = new URL(baseUrl)
    if (protocol !== 'http:' && protocol !== 'https:') return false
    const host = hostname.toLowerCase()
    if (host === 'localhost' || host === '127.0.0.1' || host === '::1' || host.endsWith('.local')) {
      return false
    }
    return true
  } catch {
    return false
  }
}

function accountBackUrls(base: string) {
  const path = '/dashboard/account'
  return {
    success: `${base}${path}?payment=success`,
    failure: `${base}${path}?payment=failure`,
    pending: `${base}${path}?payment=pending`,
  }
}

export async function createCheckoutPreference(input: {
  title: string
  unitPriceArs: number
  externalReference: string
  payerEmail?: string | null
}): Promise<MercadoPagoPreference> {
  const base = appBaseUrl()
  const supportsBackUrls = mercadoPagoSupportsBackUrls(base)

  const payload: Record<string, unknown> = {
    items: [
      {
        title: input.title,
        quantity: 1,
        unit_price: input.unitPriceArs,
        currency_id: 'ARS',
      },
    ],
    external_reference: input.externalReference,
  }

  if (input.payerEmail) {
    payload.payer = { email: input.payerEmail }
  }

  if (supportsBackUrls) {
    payload.notification_url = `${base}/api/payments/mercadopago/webhook`
    payload.back_urls = accountBackUrls(base)
    payload.auto_return = 'approved'
  }

  const res = await fetch(`${MP_API}/checkout/preferences`, {
    method: 'POST',
    headers: mpHeaders(),
    body: JSON.stringify(payload),
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

export type MercadoPagoOrderPayment = {
  id?: string
  amount?: string
  paid_amount?: string
  status?: string
  status_detail?: string
  reference_id?: string
}

export type MercadoPagoOrder = {
  id: string
  external_reference?: string | null
  total_amount?: string
  status?: string
  status_detail?: string
  transactions?: {
    payments?: MercadoPagoOrderPayment[]
  }
}

export async function fetchMercadoPagoOrder(orderId: string): Promise<MercadoPagoOrder> {
  const res = await fetch(`${MP_API}/v1/orders/${orderId}`, {
    headers: mpHeaders(),
    cache: 'no-store',
  })
  const body = (await res.json()) as MercadoPagoOrder & { message?: string }
  if (!res.ok) {
    throw new Error(body.message ?? `No se pudo consultar la orden ${orderId}`)
  }
  return body
}
