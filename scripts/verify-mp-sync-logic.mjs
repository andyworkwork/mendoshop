/**
 * Prueba lógica de sync sin activar planes nuevos (pago ficticio / sin external_reference).
 * node --env-file=.env.local scripts/verify-mp-sync-logic.mjs
 */

const MP_API = 'https://api.mercadopago.com'
const token = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim()

async function fetchPayment(id) {
  const res = await fetch(`${MP_API}/v1/payments/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return { res, body: await res.json() }
}

console.log('\n=== Lógica sync (solo lectura MP) ===\n')

// Pago inexistente → debe fallar al consultar (como en confirmPlanPaymentFromReturn)
const fake = await fetchPayment('999999999999')
if (!fake.res.ok) {
  console.log('  OK  Pago inexistente: MP devuelve error (no se activaría plan)')
} else {
  console.log('  FAIL Pago ficticio no debería existir')
  process.exitCode = 1
}

// Pago real aprobado en DB
const realId = '160206016950'
const real = await fetchPayment(realId)
if (real.res.ok && real.body.status === 'approved' && real.body.external_reference) {
  console.log(`  OK  Pago ${realId}: approved, external_reference=${real.body.external_reference}`)
  console.log(`  OK  Monto MP: ${real.body.transaction_amount}`)
} else {
  console.log('  WARN No se pudo validar pago histórico', real.body?.status)
}

console.log('\n  ..  confirmPlanPaymentFromReturn sin mpPaymentId → activated:false (código, no ejecuta server action aquí)')
console.log('  ..  confirmPlanPaymentFromReturn con mpPaymentId inválido → error de MP\n')
