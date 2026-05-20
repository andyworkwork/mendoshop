'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { confirmPlanPaymentFromReturn } from '@/app/actions/billing'

const MESSAGES: Record<string, { tone: 'ok' | 'warn' | 'err'; text: string }> = {
  success: {
    tone: 'ok',
    text: '¡Gracias! Estamos confirmando tu pago con Mercado Pago…',
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
  const router = useRouter()
  const status = params.get('payment')
  const [syncing, setSyncing] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [activated, setActivated] = useState(false)

  useEffect(() => {
    if (status !== 'success') return

    const mpPaymentId = params.get('payment_id') ?? params.get('collection_id')
    const externalReference = params.get('external_reference')

    if (!mpPaymentId && !externalReference) return

    let cancelled = false
    setSyncing(true)
    setSyncError(null)

    confirmPlanPaymentFromReturn({ mpPaymentId, externalReference }).then((res) => {
      if (cancelled) return
      if ('error' in res) {
        setSyncError(res.error)
        setSyncing(false)
        return
      }
      setActivated(res.activated)
      setSyncing(false)
      if (res.activated) {
        router.refresh()
      }
    })

    return () => {
      cancelled = true
    }
  }, [status, params, router])

  if (!status || !(status in MESSAGES)) return null

  const { tone, text } = MESSAGES[status]!
  const styles =
    tone === 'ok'
      ? 'border-emerald-800/60 bg-emerald-950/30 text-emerald-100'
      : tone === 'warn'
        ? 'border-amber-800/60 bg-amber-950/30 text-amber-100'
        : 'border-red-900/50 bg-red-950/20 text-red-200'

  let message = text
  if (status === 'success') {
    if (syncing) message = '¡Gracias! Estamos confirmando tu pago con Mercado Pago…'
    else if (syncError) message = `Pago recibido, pero hubo un problema al activar: ${syncError}`
    else if (activated) message = '¡Listo! Tu plan ya está activo. Si no ves el cambio, recargá la página.'
    else
      message =
        'Si Mercado Pago aprobó el pago, tu plan se activa en unos segundos. Recargá esta página si no ves el cambio.'
  }

  return (
    <div className={`rounded-xl border p-4 text-sm ${styles}`} role="status">
      {message}
    </div>
  )
}
