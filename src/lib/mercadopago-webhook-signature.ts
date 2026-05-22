import { createHmac, timingSafeEqual } from 'crypto'

/** Secret de firma generado en MP → Tu integración → Webhooks (no es el access token). */
export function mercadoPagoWebhookSecret(): string | null {
  const s = process.env.MERCADOPAGO_WEBHOOK_SECRET?.trim()
  return s || null
}

export function isMercadoPagoWebhookSignatureRequired(): boolean {
  return Boolean(mercadoPagoWebhookSecret())
}

type ParsedSignature = { ts: string; v1: string }

function parseXSignature(header: string | null): ParsedSignature | null {
  if (!header?.trim()) return null
  let ts: string | null = null
  let v1: string | null = null
  for (const part of header.split(',')) {
    const [key, value] = part.split('=', 2)
    if (!key || value === undefined) continue
    const k = key.trim()
    const v = value.trim()
    if (k === 'ts') ts = v
    else if (k === 'v1') v1 = v
  }
  if (!ts || !v1) return null
  return { ts, v1 }
}

/** Template oficial: id:[data.id];request-id:[x-request-id];ts:[ts]; */
function buildManifest(dataId: string, requestId: string, ts: string): string {
  return `id:${dataId};request-id:${requestId};ts:${ts};`
}

function hmacHex(secret: string, manifest: string): string {
  return createHmac('sha256', secret).update(manifest).digest('hex')
}

function safeEqualString(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  return timingSafeEqual(Buffer.from(a, 'utf8'), Buffer.from(b, 'utf8'))
}

/**
 * Valida x-signature de Mercado Pago.
 * @see https://www.mercadopago.com.ar/developers/en/docs/your-integrations/notifications/webhooks
 */
export function verifyMercadoPagoWebhookSignature(input: {
  xSignature: string | null
  xRequestId: string | null
  dataId: string | null
  secret: string
  /** Rechaza notificaciones más viejas que esto (opcional). */
  maxAgeSeconds?: number
}): boolean {
  const parsed = parseXSignature(input.xSignature)
  if (!parsed) return false

  const requestId = input.xRequestId?.trim() ?? ''
  const dataId = input.dataId?.trim() ?? ''

  if (input.maxAgeSeconds != null && input.maxAgeSeconds > 0) {
    const tsNum = Number(parsed.ts)
    if (!Number.isFinite(tsNum)) return false
    const age = Math.floor(Date.now() / 1000) - tsNum
    if (age < 0 || age > input.maxAgeSeconds) return false
  }

  const manifest = buildManifest(dataId, requestId, parsed.ts)
  const expected = hmacHex(input.secret, manifest)
  return safeEqualString(expected, parsed.v1)
}

/** data.id o id en query (IPN legacy). */
export function mercadoPagoWebhookDataIdFromUrl(url: URL): string {
  return url.searchParams.get('data.id') ?? url.searchParams.get('id') ?? ''
}
