'use client'

import { useSearchParams } from 'next/navigation'

const MESSAGES: Record<string, { tone: 'ok' | 'warn' | 'err'; text: string }> = {
  success: {
    tone: 'ok',
    text: '¡Gracias! Si Mercado Pago aprobó el pago, tu plan se activa en unos segundos. Recargá esta página si no ves el cambio.',
  },
  pending: {
    tone: 'warn',
    text: 'Tu pago está pendiente. Cuando se acredite, activamos el plan automáticamente.',
  },
  failure: {
    tone: 'err',
    text: 'El pago no se completó. Podés intentar de nuevo o escribirnos por WhatsApp.',
  },
}

export function PlanPaymentNotice() {
  const params = useSearchParams()
  const status = params.get('payment')
  if (!status || !(status in MESSAGES)) return null

  const { tone, text } = MESSAGES[status]!
  const styles =
    tone === 'ok'
      ? 'border-emerald-800/60 bg-emerald-950/30 text-emerald-100'
      : tone === 'warn'
        ? 'border-amber-800/60 bg-amber-950/30 text-amber-100'
        : 'border-red-900/50 bg-red-950/20 text-red-200'

  return (
    <div className={`rounded-xl border p-4 text-sm ${styles}`} role="status">
      {text}
    </div>
  )
}
