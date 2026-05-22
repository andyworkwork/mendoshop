/**
 * Verifica conectividad con Mercado Pago y rutas locales (sin crear cobros).
 * Uso: node --env-file=.env.local scripts/verify-mercadopago.mjs
 */

const MP_API = 'https://api.mercadopago.com'

function ok(msg) {
  console.log(`  OK  ${msg}`)
}
function fail(msg) {
  console.log(`  FAIL ${msg}`)
  process.exitCode = 1
}
function warn(msg) {
  console.log(`  WARN ${msg}`)
}
function info(msg) {
  console.log(`  ..  ${msg}`)
}

const token = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim()
const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(/\/$/, '')
const devBase = process.env.VERIFY_MP_BASE_URL?.trim() || 'http://localhost:3000'

console.log('\n=== Mercado Pago — verificación ===\n')

if (!token) {
  fail('MERCADOPAGO_ACCESS_TOKEN no está en .env.local')
  process.exit(1)
}
ok(`Token configurado (${token.startsWith('TEST-') ? 'sandbox TEST' : 'producción'})`)

// 1) API: token válido (pago inexistente → 404, no 401)
try {
  const res = await fetch(`${MP_API}/v1/payments/1`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const body = await res.json().catch(() => ({}))
  if (res.status === 401 || res.status === 403) {
    fail(`API MP rechazó el token (HTTP ${res.status})`)
  } else if (res.status === 404 || body?.message?.includes('not found')) {
    ok(`API MP responde con token válido (HTTP ${res.status} en pago de prueba)`)
  } else {
    ok(`API MP respondió HTTP ${res.status}`)
  }
} catch (e) {
  fail(`No se pudo contactar API MP: ${e.message}`)
}

// 2) back_urls en producción
try {
  const { hostname } = new URL(appUrl)
  const local =
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.endsWith('.local')
  if (local) {
    warn(`NEXT_PUBLIC_APP_URL=${appUrl} — MP no usará back_urls/auto_return (normal en local)`)
  } else {
    ok(`NEXT_PUBLIC_APP_URL=${appUrl} — back_urls y webhook pueden configurarse en MP`)
    info(`Webhook esperado: ${appUrl}/api/payments/mercadopago/webhook`)
  }
} catch {
  fail('NEXT_PUBLIC_APP_URL inválida')
}

// 3) Webhook local (servidor dev)
try {
  const res = await fetch(`${devBase}/api/payments/mercadopago/webhook`, {
    signal: AbortSignal.timeout(8000),
  })
  if (res.status === 503) {
    warn('Webhook local: 503 (MP no configurado en ese proceso — reiniciá npm run dev)')
  } else if (res.ok) {
    const json = await res.json().catch(() => null)
    if (json?.ok === true) ok(`Webhook local GET responde (${devBase})`)
    else fail(`Webhook local respuesta inesperada: ${res.status}`)
  } else {
    fail(`Webhook local HTTP ${res.status} — ¿está corriendo npm run dev en ${devBase}?`)
  }
} catch (e) {
  fail(`Webhook local no alcanzable (${devBase}): ${e.message}`)
}

// 4) Supabase: último pago de plan (solo lectura)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
if (supabaseUrl && serviceKey) {
  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/shop_plan_payments?select=id,status,mp_payment_id,created_at&order=created_at.desc&limit=3`,
      {
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
        },
      },
    )
    const rows = await res.json()
    if (!res.ok) {
      warn(`No se pudo listar shop_plan_payments: ${JSON.stringify(rows)}`)
    } else if (!Array.isArray(rows) || rows.length === 0) {
      info('Sin pagos de plan en la base (normal si nunca probaste checkout)')
    } else {
      info('Últimos pagos de plan en DB:')
      for (const r of rows) {
        info(`  ${r.id.slice(0, 8)}… status=${r.status} mp_id=${r.mp_payment_id ?? '—'}`)
      }
      const approved = rows.find((r) => r.status === 'approved' && r.mp_payment_id)
      if (approved) {
        const mpRes = await fetch(`${MP_API}/v1/payments/${approved.mp_payment_id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const mp = await mpRes.json()
        if (mpRes.ok && mp.status === 'approved') {
          ok(`Pago real ${approved.mp_payment_id} sigue aprobado en MP`)
        } else {
          warn(`Pago ${approved.mp_payment_id} en DB approved pero MP: ${mp.status ?? mpRes.status}`)
        }
      }
    }
  } catch (e) {
    warn(`Supabase check: ${e.message}`)
  }
}

console.log('\n=== Fin ===')
console.log(
  process.exitCode
    ? '\nHay fallos. Revisá token, npm run dev, o NEXT_PUBLIC_APP_URL.\n'
    : '\nConexión y rutas OK. Para probar cobro: dashboard → Cuenta → plan → tarjeta de prueba MP (sandbox).\n',
)
