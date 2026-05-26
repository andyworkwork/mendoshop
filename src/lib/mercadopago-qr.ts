import type { PlanCheckoutProduct } from '@/lib/plan-checkout'
import { checkoutProductLabel } from '@/lib/plan-checkout'

const MP_API = 'https://api.mercadopago.com'
const DEFAULT_STORE_EXTERNAL_ID = 'MENDOSHOP001'
const DEFAULT_POS_EXTERNAL_ID = 'MENDOSHOP001POS001'

function accessToken(): string {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim()
  if (!token) throw new Error('Mercado Pago no está configurado.')
  return token
}

function mpUserId(): string {
  const id = accessToken().split('-').pop()
  if (!id) throw new Error('Token de Mercado Pago inválido.')
  return id
}

function storeExternalId(): string {
  return process.env.MERCADOPAGO_QR_STORE_EXTERNAL_ID?.trim() || DEFAULT_STORE_EXTERNAL_ID
}

function posExternalId(): string {
  return process.env.MERCADOPAGO_QR_POS_EXTERNAL_ID?.trim() || DEFAULT_POS_EXTERNAL_ID
}

function mpHeaders(extra?: HeadersInit): HeadersInit {
  return {
    Authorization: `Bearer ${accessToken()}`,
    'Content-Type': 'application/json',
    ...extra,
  }
}

function formatArsAmount(amount: number): string {
  return amount.toFixed(2)
}

type MpErrorBody = {
  message?: string
  error?: string
  errors?: Array<{ message?: string; code?: string; details?: string[] }>
}

function parseMpError(body: MpErrorBody, status: number): string {
  if (Array.isArray(body.errors) && body.errors.length > 0) {
    const parts = body.errors.flatMap((entry) => {
      if (entry.details?.length) return entry.details
      if (entry.message) return [entry.message]
      if (entry.code) return [entry.code]
      return []
    })
    if (parts.length > 0) return parts.join(' ')
  }
  return body.message ?? body.error ?? `Mercado Pago respondió ${status}`
}

let posReadyPromise: Promise<string> | null = null

async function mpJson<T>(url: string, init?: RequestInit): Promise<{ ok: boolean; status: number; body: T }> {
  const res = await fetch(url, init)
  const body = (await res.json()) as T
  return { ok: res.ok, status: res.status, body }
}

async function findPos(externalId: string): Promise<boolean> {
  const { ok, body } = await mpJson<{ results?: Array<{ external_id?: string }> }>(
    `${MP_API}/pos?external_id=${encodeURIComponent(externalId)}`,
    { headers: mpHeaders(), cache: 'no-store' },
  )
  return ok && Boolean(body.results?.some((pos) => pos.external_id === externalId))
}

async function findStore(userId: string, externalId: string): Promise<string | null> {
  const { ok, body } = await mpJson<{ results?: Array<{ id?: string | number; external_id?: string }> }>(
    `${MP_API}/users/${userId}/stores/search?external_id=${encodeURIComponent(externalId)}`,
    { headers: mpHeaders(), cache: 'no-store' },
  )
  if (!ok) return null
  const store = body.results?.find((row) => row.external_id === externalId)
  return store?.id != null ? String(store.id) : null
}

async function createStore(userId: string, externalId: string): Promise<string> {
  const { ok, status, body } = await mpJson<{ id?: string | number; message?: string; error?: string }>(
    `${MP_API}/users/${userId}/stores`,
    {
      method: 'POST',
      headers: mpHeaders(),
      body: JSON.stringify({
        name: 'Mendoshop Planes',
        external_id: externalId,
        location: {
          street_number: '1',
          street_name: 'Online',
          city_name: 'Mendoza',
          state_name: 'Mendoza',
          latitude: -32.89084,
          longitude: -68.82717,
          reference: 'Suscripciones Mendoshop',
        },
      }),
    },
  )

  if (ok && body.id != null) return String(body.id)

  const existing = await findStore(userId, externalId)
  if (existing) return existing

  throw new Error(parseMpError(body, status))
}

async function createPos(storeId: string, storeExternal: string, externalId: string): Promise<void> {
  const { ok, status, body } = await mpJson<MpErrorBody>(`${MP_API}/pos`, {
    method: 'POST',
    headers: mpHeaders(),
    body: JSON.stringify({
      name: 'Mendoshop Suscripciones',
      fixed_amount: true,
      store_id: Number(storeId),
      external_store_id: storeExternal,
      external_id: externalId,
      category: 621102,
    }),
  })

  if (ok) return
  if (await findPos(externalId)) return

  throw new Error(parseMpError(body, status))
}

/** Crea (una vez) la sucursal y caja QR requeridas por Mercado Pago. */
async function ensureQrPos(): Promise<string> {
  if (!posReadyPromise) {
    posReadyPromise = setupQrPos().catch((error) => {
      posReadyPromise = null
      throw error
    })
  }
  return posReadyPromise
}

async function setupQrPos(): Promise<string> {
  const storeExternal = storeExternalId()
  const posExternal = posExternalId()
  const userId = mpUserId()

  if (await findPos(posExternal)) return posExternal

  let storeId = await findStore(userId, storeExternal)
  if (!storeId) {
    storeId = await createStore(userId, storeExternal)
  }

  await createPos(storeId, storeExternal, posExternal)
  return posExternal
}

export type CreatePlanQrResult =
  | { ok: true; qrData: string; mpOrderId: string }
  | { error: string }

export async function createPlanQrCode(input: {
  product: PlanCheckoutProduct
  externalReference: string
  unitPriceArs: number
  daysAdded: number
}): Promise<CreatePlanQrResult> {
  try {
    const posId = await ensureQrPos()
    const amount = formatArsAmount(input.unitPriceArs)
    const title = `Mendoshop ${checkoutProductLabel(input.product)}`
    const description = `${title} (${input.daysAdded} dia${input.daysAdded === 1 ? '' : 's'})`.slice(0, 150)

    const payload = {
      type: 'qr',
      total_amount: amount,
      description,
      external_reference: input.externalReference,
      expiration_time: 'PT10M',
      config: {
        qr: {
          external_pos_id: posId,
          mode: 'dynamic',
        },
      },
      transactions: {
        payments: [{ amount }],
      },
      items: [
        {
          title,
          unit_price: amount,
          quantity: 1,
          unit_measure: 'unit',
        },
      ],
    }

    const { ok, status, body } = await mpJson<
      MpErrorBody & {
        id?: string
        type_response?: { qr_data?: string }
      }
    >(`${MP_API}/v1/orders`, {
      method: 'POST',
      headers: mpHeaders({
        'X-Idempotency-Key': `shop_plan_qr:${input.externalReference}`,
      }),
      body: JSON.stringify(payload),
    })

    if (!ok) {
      return { error: parseMpError(body, status) }
    }

    const qrData = body.type_response?.qr_data
    const mpOrderId = body.id
    if (!qrData || !mpOrderId) {
      return { error: 'Mercado Pago no devolvió el QR.' }
    }

    return { ok: true, qrData: String(qrData), mpOrderId: String(mpOrderId) }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'No se pudo generar el QR.' }
  }
}
